// วิธีชำระเงินที่ร้านรับ — ใช้ร่วมกันทั้งตอนขายหน้าร้าน หน้าบิล และรายงานยอดขาย
// เรียงตามความถี่ที่ใช้จริง เงินสดจึงเป็นค่าเริ่มต้น
export const PAYMENT_METHODS = [
  { id: "CASH", name: "เงินสด" },
  { id: "QR_CODE", name: "สแกนจ่าย" },
  { id: "CREDIT_CARD", name: "บัตรเครดิต" },
];

export const DEFAULT_PAYMENT_METHOD = "CASH";

export const getPaymentMethodText = (method) =>
  PAYMENT_METHODS.find((item) => item.id === method)?.name || "";
