const { test } = require("node:test");
const assert = require("node:assert");
const { _test } = require("../utils/printReceipt");

const { pickReceiptPrinter } = _test;
// เครื่องฉลากเป็นค่าเริ่มต้นและอยู่ลำดับแรก ใบเสร็จต้องไม่ไปออกตัวนั้น
const printers = [
  { name: "Xprinter XP-420B" },
  { name: "Microsoft Print to PDF" },
  { name: "EPSON L3250 Series" },
];

test("ไม่ได้ตั้ง PRINTER_NAME เลือกเครื่อง Epson ไม่ใช่เครื่องแรกหรือค่าเริ่มต้น", () => {
  assert.equal(pickReceiptPrinter(printers), "EPSON L3250 Series");
});

test("ตั้ง PRINTER_NAME ไว้ใช้ชื่อนั้น", () => {
  assert.equal(
    pickReceiptPrinter(printers, "Microsoft Print to PDF"),
    "Microsoft Print to PDF",
  );
});

test("ไม่มี Epson หรือชื่อที่ตั้งไม่มีอยู่ แจ้งข้อผิดพลาด ไม่ส่งไปเครื่องอื่นแทน", () => {
  assert.throws(() => pickReceiptPrinter([{ name: "Xprinter XP-420B" }]), {
    code: 503,
  });
  assert.throws(() => pickReceiptPrinter(printers, "EPSON L3110"), {
    code: 503,
  });
});
