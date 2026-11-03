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

// หน่วยงานมาจ่ายบิลเครดิตด้วยเช็ค บิลอื่นรับเช็คไม่ได้ จึงไม่อยู่ใน PAYMENT_METHODS
export const CHEQUE_METHOD_ID = "CHEQUE";
export const ALL_PAYMENT_METHODS = [
  ...PAYMENT_METHODS,
  { id: CHEQUE_METHOD_ID, name: "เช็ค" },
];

// กำลังตัดเครดิต หรือเคยเป็นใบส่งของแล้วมาแก้วิธีจ่ายทีหลัง (ตรงกับ updateRepairStatus ฝั่งเซิร์ฟเวอร์)
export const canPayByCheque = (repair) =>
  repair?.status === "CREDIT" || !!repair?.deliveryNo;

// ต้องตรงกับ updateRepairStatusSchema ฝั่งเซิร์ฟเวอร์
// วันที่บนเช็คไม่บังคับ ไม่ได้เลือกช่องลงวันที่บนใบเสร็จก็เว้นไว้เขียนมือ
export const chequeErrorsOf = ({ bank, no }) => ({
  ...(String(bank || "").trim()
    ? {}
    : { chequeBank: { message: "กรุณากรอกธนาคาร" } }),
  ...(String(no || "").trim()
    ? {}
    : { chequeNo: { message: "กรุณากรอกเลขที่" } }),
});

export const getPaymentMethodText = (method) =>
  ALL_PAYMENT_METHODS.find((item) => item.id === method)?.name || "";
