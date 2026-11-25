const { test } = require("node:test");
const assert = require("node:assert");
const { _test } = require("../utils/printReceipt");

const { pickReceiptPrinter, isLabelPrinterPort } = _test;
// เครื่องฉลากอยู่ลำดับแรก ใบเสร็จต้องไม่ไปออกตัวนั้นเพียงเพราะอยู่ต้นรายการ
const printers = [
  { name: "Xprinter XP-420B" },
  { name: "Microsoft Print to PDF" },
  { name: "EPSON L3250 Series" },
];

test("ไม่ได้ตั้ง PRINTER_NAME ใช้เครื่องเริ่มต้นของวินโดวส์ ไม่ใช่เครื่องแรกในรายการ", () => {
  assert.equal(
    pickReceiptPrinter(printers, undefined, "EPSON L3250 Series"),
    "EPSON L3250 Series",
  );
});

test("ตั้ง PRINTER_NAME ไว้ใช้ชื่อนั้น ไม่สนเครื่องเริ่มต้น", () => {
  assert.equal(
    pickReceiptPrinter(
      printers,
      "Microsoft Print to PDF",
      "EPSON L3250 Series",
    ),
    "Microsoft Print to PDF",
  );
});

test("ชื่อที่ตั้งไม่มีอยู่ หรือไม่มีเครื่องเริ่มต้น แจ้งข้อผิดพลาด ไม่ส่งไปเครื่องอื่นแทน", () => {
  assert.throws(() => pickReceiptPrinter(printers, "EPSON L3110"), {
    code: 503,
  });
  assert.throws(() => pickReceiptPrinter(printers, undefined, null), {
    code: 503,
  });
});

test("พอร์ตที่มีไอพีของเครื่องฉลากนับเป็นเครื่องฉลาก ไอพีอื่นที่ขึ้นต้นเหมือนกันไม่นับ", () => {
  assert.equal(isLabelPrinterPort("IP_192.168.1.187", "192.168.1.187"), true);
  assert.equal(isLabelPrinterPort("192.168.1.187", "192.168.1.187"), true);
  assert.equal(isLabelPrinterPort("IP_192.168.1.18", "192.168.1.187"), false);
  assert.equal(isLabelPrinterPort("IP_192.168.1.1870", "192.168.1.187"), false);
  assert.equal(isLabelPrinterPort("USB001", "192.168.1.187"), false);
});
