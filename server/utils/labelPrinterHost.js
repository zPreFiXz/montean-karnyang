// ที่อยู่เครื่องพิมพ์ฉลากในวงแลน ใช้ทั้งตอนส่งงานฉลาก (printLabel.js)
// และตอนกันใบเสร็จไปออกเครื่องนี้ (printReceipt.js) ค่าต้องตรงกันทั้งสองที่จึงแยกไว้ไฟล์เดียว
const labelPrinterHost = () =>
  process.env.LABEL_PRINTER_HOST || "192.168.1.187";

module.exports = { labelPrinterHost };
