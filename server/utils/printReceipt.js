const os = require("os");
const path = require("path");
const fs = require("fs/promises");
const { execFile } = require("child_process");
const { existsSync } = require("fs");
const puppeteer = require("puppeteer-core");
const createError = require("./createError");

// ใช้ Chrome ที่ลงไว้ในเครื่องอยู่แล้ว ไม่โหลดเบราว์เซอร์มาเก็บในโปรเจคอีกก้อน
// ตั้ง CHROME_PATH ใน .env ได้ถ้าลงไว้คนละที่
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
].filter(Boolean);

const findChrome = () => {
  const found = CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!found) {
    createError(
      500,
      "ไม่พบ Chrome ในเครื่องนี้ ติดตั้ง Chrome หรือกำหนด CHROME_PATH ก่อน",
    );
  }
  return found;
};

// เปิด Chrome ค้างไว้ตัวเดียวใช้ซ้ำ เปิดใหม่ทุกครั้งเสียเวลาเกือบวินาที (เครื่องร้านช้ากว่านั้น)
// เก็บเป็น promise กันสองคำขอที่มาพร้อมกันเปิด Chrome ซ้อนกันสองตัว
let browserPromise = null;

const getBrowser = () => {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        executablePath: findChrome(),
        headless: true,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      })
      .then((browser) => {
        // Chrome ปิดไปเอง (ค้าง ถูกฆ่า) รอบหน้าจะเปิดใหม่
        browser.on("disconnected", () => {
          browserPromise = null;
        });
        return browser;
      })
      .catch((error) => {
        browserPromise = null;
        throw error;
      });
  }
  return browserPromise;
};

const withPage = async (html, work) => {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // ขนาดหน้าต่างเท่ากระดาษ A5 (148 x 210 มม.) รูปที่ถ่ายจะได้จัดหน้าเหมือนใบที่พิมพ์
    // ความละเอียดสองเท่า ตัวหนังสือในรูปจะคมตอนลูกค้าซูมดูในโทรศัพท์
    await page.setViewport({ width: 560, height: 794, deviceScaleFactor: 2 });
    // ฟอนต์ฝังอยู่ใน HTML แล้ว ไม่ต้องรอเน็ตเงียบ (networkidle0 รอเปล่าครึ่งวินาที) รอแค่ฟอนต์พร้อม
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    return await work(page);
  } finally {
    await page.close().catch(() => {});
  }
};

const htmlToPdf = (html) =>
  withPage(html, (page) =>
    page.pdf({
      format: "A5",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    }),
  );

// ใบเสร็จหลายแผ่นได้รูปละแผ่น ใบสั่งซ่อมไม่มีกรอบแผ่นแยก ทั้งหน้าคือหนึ่งแผ่น จึงถ่ายทั้งหน้าต่าง
const htmlToImages = (html) =>
  withPage(html, async (page) => {
    const sheets = await page.$$(".receipt-paper");
    const shots = sheets.length
      ? await Promise.all(
          sheets.map((sheet) => sheet.screenshot({ type: "png" })),
        )
      : [await page.screenshot({ type: "png" })];
    return shots.map((shot) => Buffer.from(shot).toString("base64"));
  });

const run = (command, args) =>
  new Promise((resolve, reject) => {
    execFile(command, args, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve(stdout);
    });
  });

// คิวพิมพ์ของระบบปฏิบัติการรับงานได้เสมอ ถึงเครื่องพิมพ์จะไม่ได้เสียบอยู่
// งานจะไปค้างในคิวเงียบๆ แล้วคนกดจะนึกว่าพิมพ์ไปแล้ว จึงต้องเช็กสถานะก่อนส่ง
const ensurePrinterReady = async (printerName) => {
  if (os.platform() === "win32") {
    const printer = require("pdf-to-printer");
    const printers = await printer.getPrinters().catch(() => []);
    if (printers.length === 0) {
      createError(503, "ไม่พบเครื่องพิมพ์ กรุณาตรวจสอบสายและเปิดเครื่องพิมพ์");
    }

    // ถามสถานะจริงของเครื่อง ถ้าถามไม่ได้ก็ปล่อยผ่าน ดีกว่าบล็อกการพิมพ์เพราะตัวเช็กเอง
    const target = printerName || printers[0]?.name;
    const status = await run("powershell", [
      "-NoProfile",
      "-Command",
      `(Get-Printer -Name '${target}').PrinterStatus`,
    ]).catch(() => "");

    if (/offline|error|paused/i.test(status)) {
      createError(
        503,
        "เครื่องพิมพ์ไม่พร้อม กรุณาตรวจสอบสายและเปิดเครื่องพิมพ์",
      );
    }
    return;
  }

  const listing = await run("lpstat", ["-p"]).catch(() => "");
  if (!listing.trim()) {
    createError(503, "ไม่พบเครื่องพิมพ์ กรุณาตรวจสอบสายและเปิดเครื่องพิมพ์");
  }

  // ดูเฉพาะย่อหน้าของเครื่องที่จะใช้ ไม่งั้นเครื่องอื่นที่ออฟไลน์จะทำให้ทั้งระบบพิมพ์ไม่ได้
  const blocks = listing.split(/\n(?=\S)/);
  const block = printerName
    ? blocks.find((part) => part.includes(printerName)) || ""
    : blocks[0] || "";

  if (/offline|ออฟไลน์|disabled|ปิดใช้งาน/i.test(block)) {
    createError(503, "เครื่องพิมพ์ไม่พร้อม กรุณาตรวจสอบสายและเปิดเครื่องพิมพ์");
  }
};

const sendToPrinter = async (filePath, printerName) => {
  if (os.platform() === "win32") {
    // require ตรงนี้ เพราะแพ็กเกจนี้ใช้ได้เฉพาะวินโดวส์
    const printer = require("pdf-to-printer");
    await printer.print(filePath, {
      ...(printerName ? { printer: printerName } : {}),
      paperSize: "A5",
      // พิมพ์ขาวดำเสมอ เครื่องสีจะได้ไม่ผสมหมึกสีมาทำสีดำ ประหยัดตลับสี
      monochrome: true,
    });
    return;
  }

  await run("lp", [
    ...(printerName ? ["-d", printerName] : []),
    "-o",
    "media=A5",
    // พิมพ์ขาวดำเสมอ (สองชื่อเพราะไดรเวอร์แต่ละรุ่นรู้จักคนละชื่อ ตัวที่ไม่รู้จักจะถูกข้ามไป)
    "-o",
    "print-color-mode=monochrome",
    "-o",
    "ColorModel=Gray",
    filePath,
  ]);
};

// แปลข้อผิดพลาดของเครื่องพิมพ์เป็นภาษาที่คนหน้าร้านทำตามได้
const toPrinterError = (error) => {
  const text = String(error?.message || "");

  if (/no default destination|ไม่พบเครื่องพิมพ์|no destinations/i.test(text)) {
    return "ไม่พบเครื่องพิมพ์ กรุณาตรวจสอบสายและเปิดเครื่องพิมพ์";
  }
  if (/not found|ENOENT/i.test(text)) {
    return "เครื่องนี้สั่งพิมพ์ไม่ได้ ตรวจสอบการติดตั้งเครื่องพิมพ์";
  }
  return "สั่งพิมพ์ไม่สำเร็จ ลองใหม่อีกครั้ง";
};

const printReceipt = async (html, fileTag) => {
  // เช็กเครื่องพิมพ์ไปพร้อมกับสร้าง PDF บนวินโดวส์ต้องเรียก PowerShell ซึ่งช้าเกือบวินาที
  const [pdf] = await Promise.all([
    htmlToPdf(html),
    ensurePrinterReady(process.env.PRINTER_NAME),
  ]);
  const filePath = path.join(
    os.tmpdir(),
    `receipt-${fileTag}-${Date.now()}.pdf`,
  );

  await fs.writeFile(filePath, pdf);
  try {
    await sendToPrinter(filePath, process.env.PRINTER_NAME);
  } catch (error) {
    createError(503, toPrinterError(error));
  } finally {
    // ลบไฟล์ชั่วคราวเสมอ ไม่ให้ใบเสร็จของลูกค้าค้างอยู่ในเครื่อง
    await fs.unlink(filePath).catch(() => {});
  }
};

module.exports = { printReceipt, htmlToImages };
