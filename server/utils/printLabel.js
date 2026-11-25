const net = require("net");
const { withPage } = require("./printReceipt");
const { labelPrinterHost } = require("./labelPrinterHost");
const { buildPartItemName } = require("./repairItemName");
const { buildLabelHtml, DOTS_PER_MM } = require("./labelHtml");
const { encodeCostCode } = require("./costCode");
const createError = require("./createError");

// เครื่องพิมพ์ฉลาก (สติกเกอร์ความร้อน) ต่อผ่าน LAN รับงานดิบภาษา TSPL ที่พอร์ต 9100
// ไม่ผ่านคิวพิมพ์ของวินโดวส์ ไม่ต้องลงไดรเวอร์ และรู้ทันทีว่าเครื่องติดต่อได้หรือไม่
const config = () => ({
  host: labelPrinterHost(),
  port: Number(process.env.LABEL_PRINTER_PORT) || 9100,
  gapMm: Number(process.env.LABEL_GAP_MM ?? 2),
  // ฉลากออกมากลับหัว เปลี่ยนเป็น 0 (หรือ 1) ใน .env ได้โดยไม่ต้องแก้โค้ด
  direction: Number(process.env.LABEL_DIRECTION ?? 1),
  // ความเข้ม 0-15 ตัวหนังสือจางให้เพิ่ม เลอะหรือหนาไปให้ลด
  density: Number(process.env.LABEL_DENSITY ?? 8),
});

const MAX_COPIES = 100;
// ขนาดสติกเกอร์ที่ร้านใช้ (ต้องตรงกับ LABEL_SIZES ฝั่งหน้าเว็บและ partLabelSchema)
const LABEL_SIZES = {
  "60x40": { widthMm: 60, heightMm: 40 },
  "50x30": { widthMm: 50, heightMm: 30 },
  "40x30": { widthMm: 40, heightMm: 30 },
  "40x20": { widthMm: 40, heightMm: 20 },
};
const sizeOf = (size) => LABEL_SIZES[size] || LABEL_SIZES["60x40"];
// ค่าความสว่างที่ต่ำกว่านี้นับเป็นจุดดำ ตั้งสูงกว่ากึ่งกลางเพื่อให้ขอบตัวหนังสือไทยเส้นบางไม่ขาด
const BLACK_THRESHOLD = 170;

// วาดฉลากใน Chrome แล้วแปลงเป็นภาพขาวดำ 1 บิต ได้ทั้งรูปตัวอย่างและข้อมูลส่งเครื่องพิมพ์
// รูปตัวอย่างมาจากข้อมูลชุดเดียวกับที่พิมพ์ หน้าจอจึงเห็นเหมือนกระดาษที่ออกมาทุกจุด
const renderLabel = (labelData, size) => {
  const { widthMm, heightMm } = sizeOf(size);
  const width = widthMm * DOTS_PER_MM;
  const height = heightMm * DOTS_PER_MM;
  const html = buildLabelHtml({ ...labelData, widthMm, heightMm });

  return withPage(
    html,
    async (page) => {
      // ชื่อยาวย่อตัวหนังสือลงจนพอกล่อง ไม่ตัดคำทิ้ง ขนาดเริ่มและต่ำสุดตามขนาดสติกเกอร์ (data-max data-min)
      await page.evaluate(() => {
        const box = document.querySelector(".name-box");
        const name = document.querySelector(".name");
        let size = Number(name.dataset.max);
        const min = Number(name.dataset.min);
        while (name.scrollHeight > box.clientHeight && size > min) {
          size -= 2;
          name.style.fontSize = `${size}px`;
        }
      });

      const shot = await page.screenshot({
        type: "png",
        encoding: "base64",
        clip: { x: 0, y: 0, width, height },
      });

      return page.evaluate(
        async (src, w, h, threshold) => {
          const img = new Image();
          img.src = `data:image/png;base64,${src}`;
          await img.decode();

          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          const pixels = ctx.getImageData(0, 0, w, h);
          const rowBytes = w / 8;
          // TSPL: บิต 1 = ขาว บิต 0 = จุดที่ถูกพิมพ์ เริ่มจากขาวทั้งแผ่นแล้วเจาะจุดดำ
          const bits = new Uint8Array(rowBytes * h).fill(0xff);

          for (let y = 0; y < h; y += 1) {
            for (let x = 0; x < w; x += 1) {
              const i = (y * w + x) * 4;
              const d = pixels.data;
              const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
              const black = lum < threshold;
              if (black) bits[y * rowBytes + (x >> 3)] &= ~(0x80 >> (x & 7));
              const v = black ? 0 : 255;
              d[i] = v;
              d[i + 1] = v;
              d[i + 2] = v;
              d[i + 3] = 255;
            }
          }
          ctx.putImageData(pixels, 0, 0);

          let binary = "";
          for (let i = 0; i < bits.length; i += 0x8000) {
            binary += String.fromCharCode(...bits.subarray(i, i + 0x8000));
          }
          return { bits: btoa(binary), preview: canvas.toDataURL("image/png") };
        },
        shot,
        width,
        height,
        BLACK_THRESHOLD,
      );
    },
    { width, height, deviceScaleFactor: 1 },
  );
};

const buildTsplJob = (bitsBase64, copies, size) => {
  const { widthMm, heightMm } = sizeOf(size);
  const { gapMm, direction, density } = config();
  const width = widthMm * DOTS_PER_MM;
  const height = heightMm * DOTS_PER_MM;

  const header = [
    `SIZE ${widthMm} mm,${heightMm} mm`,
    `GAP ${gapMm} mm,0 mm`,
    `DIRECTION ${direction},0`,
    "REFERENCE 0,0",
    `DENSITY ${density}`,
    "CLS",
    `BITMAP 0,0,${width / 8},${height},0,`,
  ].join("\r\n");

  return Buffer.concat([
    Buffer.from(header, "ascii"),
    Buffer.from(bitsBase64, "base64"),
    Buffer.from(`\r\nPRINT ${copies},1\r\n`, "ascii"),
  ]);
};

// คำสั่งถามสถานะ <ESC>!? ของ TSPL ตอบกลับหนึ่งไบต์ (0 = พร้อม)
// เครื่องบางรุ่นไม่ตอบ จึงรอแค่ครู่เดียวแล้วส่งงานต่อ ดีกว่าบล็อกการพิมพ์เพราะตัวเช็กเอง
const STATUS_QUERY = Buffer.from([0x1b, 0x21, 0x3f]);
const STATUS_WAIT_MS = 600;
const STATUS_ERRORS = [
  [0x01, "ฝาเครื่องพิมพ์ฉลากเปิดอยู่ กรุณาปิดฝาแล้วลองใหม่อีกครั้ง"],
  [0x02, "กระดาษในเครื่องพิมพ์ฉลากติด กรุณาตรวจสอบแล้วลองใหม่อีกครั้ง"],
  [0x04, "สติกเกอร์ในเครื่องพิมพ์ฉลากหมด กรุณาใส่ม้วนใหม่แล้วลองใหม่อีกครั้ง"],
  [
    0x10,
    "เครื่องพิมพ์ฉลากหยุดชั่วคราวอยู่ กรุณากดปุ่มที่เครื่องแล้วลองใหม่อีกครั้ง",
  ],
  [0x80, "เครื่องพิมพ์ฉลากมีปัญหา กรุณาปิดเปิดเครื่องแล้วลองใหม่อีกครั้ง"],
];

const CONNECT_TIMEOUT_MS = 3000;

const sendToLabelPrinter = (job) => {
  const { host, port } = config();
  // ไม่บอกเลข IP พนักงานแก้เองไม่ได้ ผู้ดูแลดูได้จาก LABEL_PRINTER_HOST ใน .env
  const offline =
    "เชื่อมต่อเครื่องพิมพ์ฉลากไม่ได้ กรุณาตรวจสอบว่าเปิดเครื่องและเสียบสาย LAN แล้วลองใหม่อีกครั้ง";

  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port });
    let settled = false;
    let statusTimer = null;

    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(statusTimer);
      if (error) {
        socket.destroy();
        const wrapped = new Error(error.message);
        wrapped.code = 503;
        reject(wrapped);
      } else {
        resolve();
      }
    };

    const sendJob = () => {
      if (settled) return;
      socket.removeAllListeners("data");
      // end() ส่งข้อมูลจนหมดแล้วค่อยปิด เครื่องพิมพ์รับงานครบก่อนสายตัด
      socket.end(job, () => finish());
    };

    socket.setTimeout(CONNECT_TIMEOUT_MS, () => finish(new Error(offline)));
    socket.on("error", () => finish(new Error(offline)));

    socket.once("connect", () => {
      socket.write(STATUS_QUERY);
      statusTimer = setTimeout(sendJob, STATUS_WAIT_MS);
    });

    socket.once("data", (data) => {
      clearTimeout(statusTimer);
      const status = data[0];
      const problem = STATUS_ERRORS.find(([bit]) => status & bit);
      if (problem) finish(new Error(problem[1]));
      else sendJob();
    });
  });
};

// costPrice ไม่ส่งมา (ช่องว่าง) = ไม่พิมพ์รหัสทุน
const costCodeOf = (costPrice) => {
  if (costPrice == null) return null;
  const code = encodeCostCode(costPrice);
  if (!code) {
    // LABEL_COST_KEY ใน .env ไม่มีหรือผิดรูปแบบ: ต้องเป็นตัวอักษรภาษาอังกฤษไม่ซ้ำกัน 9 หรือ 10 ตัว แบบ 9 ตัวห้ามมีตัว O
    createError(400, "ยังไม่ได้ตั้งรหัสลับราคาต้นทุน กรุณาแจ้งผู้ดูแลระบบ");
  }
  return code;
};

const labelDataOf = (part, { costPrice } = {}) => ({
  name: buildPartItemName(part) || part.name,
  partNumber: part.partNumber,
  price: part.sellingPrice,
  unit: part.unit,
  costCode: costCodeOf(costPrice),
});

const previewPartLabel = async (part, { size, costPrice }) => {
  const { preview } = await renderLabel(labelDataOf(part, { costPrice }), size);
  return preview;
};

const printPartLabel = async (part, { copies, size, costPrice }) => {
  const count = Math.min(Math.max(Math.trunc(copies) || 1, 1), MAX_COPIES);
  const { bits } = await renderLabel(labelDataOf(part, { costPrice }), size);
  await sendToLabelPrinter(buildTsplJob(bits, count, size));
  return count;
};

module.exports = {
  previewPartLabel,
  printPartLabel,
  MAX_COPIES,
  _test: { buildTsplJob, renderLabel },
};
