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

const htmlToPdf = async (html) => {
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    // waitUntil networkidle0 เพื่อให้ฟอนต์จากเน็ต (ถ้ามี) โหลดเสร็จก่อนแปลงเป็น PDF
    await page.setContent(html, { waitUntil: "networkidle0" });
    return await page.pdf({
      format: "A5",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });
  } finally {
    await browser.close();
  }
};

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
      createError(
        503,
        "พิมพ์ไม่ได้ เพราะไม่พบเครื่องพิมพ์ กรุณาตรวจสอบสายและเปิดเครื่องพิมพ์",
      );
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
        "พิมพ์ไม่ได้ เพราะเครื่องพิมพ์ยังไม่พร้อม กรุณาตรวจสอบสายและเปิดเครื่องพิมพ์",
      );
    }
    return;
  }

  const listing = await run("lpstat", ["-p"]).catch(() => "");
  if (!listing.trim()) {
    createError(
      503,
      "พิมพ์ไม่ได้ เพราะไม่พบเครื่องพิมพ์ กรุณาตรวจสอบสายและเปิดเครื่องพิมพ์",
    );
  }

  // ดูเฉพาะย่อหน้าของเครื่องที่จะใช้ ไม่งั้นเครื่องอื่นที่ออฟไลน์จะทำให้ทั้งระบบพิมพ์ไม่ได้
  const blocks = listing.split(/\n(?=\S)/);
  const block = printerName
    ? blocks.find((part) => part.includes(printerName)) || ""
    : blocks[0] || "";

  if (/offline|ออฟไลน์|disabled|ปิดใช้งาน/i.test(block)) {
    createError(
      503,
      "พิมพ์ไม่ได้ เพราะเครื่องพิมพ์ยังไม่พร้อม กรุณาตรวจสอบสายและเปิดเครื่องพิมพ์",
    );
  }
};

// วินโดวส์สั่งพิมพ์ผ่าน pdf-to-printer ส่วนแมค/ลินุกซ์ใช้คำสั่ง lp ที่มีอยู่แล้ว
const sendToPrinter = async (filePath, printerName) => {
  if (os.platform() === "win32") {
    // require ตรงนี้ เพราะแพ็กเกจนี้ใช้ได้เฉพาะวินโดวส์
    const printer = require("pdf-to-printer");
    await printer.print(filePath, {
      ...(printerName ? { printer: printerName } : {}),
      paperSize: "A5",
    });
    return;
  }

  await run("lp", [
    ...(printerName ? ["-d", printerName] : []),
    "-o",
    "media=A5",
    filePath,
  ]);
};

// สร้างใบเสร็จเป็น PDF แล้วส่งเข้าเครื่องพิมพ์ที่ต่อกับเครื่องนี้
// PRINTER_NAME ใน .env ไว้เลือกเครื่องเมื่อมีหลายเครื่อง ไม่ตั้งก็ใช้เครื่องที่ตั้งเป็นค่าเริ่มต้น
// แปลข้อผิดพลาดของเครื่องพิมพ์เป็นภาษาที่คนหน้าร้านทำตามได้
// ข้อความดิบจากระบบปฏิบัติการอ่านไม่รู้เรื่องและไม่ได้บอกว่าต้องทำอะไรต่อ
const toPrinterError = (error) => {
  const text = String(error?.message || "");

  if (/no default destination|ไม่พบเครื่องพิมพ์|no destinations/i.test(text)) {
    return "พิมพ์ไม่ได้ เพราะไม่พบเครื่องพิมพ์ กรุณาตรวจสอบสายและเปิดเครื่องพิมพ์";
  }
  if (/not found|ENOENT/i.test(text)) {
    return "พิมพ์ไม่ได้ เพราะเครื่องที่รันระบบยังสั่งพิมพ์ไม่ได้ กรุณาตรวจสอบการติดตั้งเครื่องพิมพ์";
  }
  return "สั่งพิมพ์ไม่สำเร็จ ตรวจสอบเครื่องพิมพ์แล้วลองใหม่อีกครั้ง";
};

const printReceipt = async (html, fileTag) => {
  const pdf = await htmlToPdf(html);
  const filePath = path.join(
    os.tmpdir(),
    `receipt-${fileTag}-${Date.now()}.pdf`,
  );

  await ensurePrinterReady(process.env.PRINTER_NAME);

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

module.exports = { printReceipt };
