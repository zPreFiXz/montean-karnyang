// ไม่ตั้งอันไหนเป็นค่าเริ่มต้น ไม่งั้นกดผ่านแล้วบิลที่รับเงินทางอื่นจะเป็นเงินสด
export const PAYMENT_METHODS = [
  { id: "CASH", name: "เงินสด" },
  { id: "QR_CODE", name: "สแกนจ่าย" },
  { id: "CREDIT_CARD", name: "บัตรเครดิต" },
];

// เครดิตไม่ใช่วิธีจ่าย ระบบเก็บเป็นสถานะของบิลแทน
export const CREDIT_OPTION_ID = "CREDIT";

export const PAYMENT_OPTIONS_WITH_CREDIT = [
  ...PAYMENT_METHODS,
  { id: CREDIT_OPTION_ID, name: "เครดิต" },
];

export const getPaymentMethodText = (method) =>
  PAYMENT_METHODS.find((item) => item.id === method)?.name || "";
