// วิธีชำระเงินที่ร้านรับ — ใช้ร่วมกันทั้งตอนขายหน้าร้าน หน้าบิล และรายงานยอดขาย
// เรียงตามความถี่ที่ใช้จริง แต่ไม่ได้ตั้งอันไหนเป็นค่าเริ่มต้น ต้องเลือกเองทุกใบ
// ไม่งั้นบิลที่รับเงินทางอื่นจะถูกบันทึกเป็นเงินสดเพราะกดผ่านโดยไม่ได้แตะช่องนี้
export const PAYMENT_METHODS = [
  { id: "CASH", name: "เงินสด" },
  { id: "QR_CODE", name: "สแกนจ่าย" },
  { id: "CREDIT_CARD", name: "บัตรเครดิต" },
];

export const getPaymentMethodText = (method) =>
  PAYMENT_METHODS.find((item) => item.id === method)?.name || "";
