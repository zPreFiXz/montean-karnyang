// ไม่ตั้งอันไหนเป็นค่าเริ่มต้น ไม่งั้นกดผ่านแล้วบิลที่รับเงินทางอื่นจะเป็นเงินสด
export const PAYMENT_METHODS = [
  // เงินสดกับโอน/สแกนจ่ายรวมเป็นวิธีเดียว คนในร้านไม่ต้องถามลูกค้าว่าจ่ายแบบไหน
  { id: "CASH", name: "เงินสด/โอน" },
  { id: "CREDIT_CARD", name: "บัตรเครดิต" },
];

// เครดิตไม่ใช่วิธีจ่าย ระบบเก็บเป็นสถานะของบิลแทน
export const CREDIT_OPTION_ID = "CREDIT";

export const PAYMENT_OPTIONS_WITH_CREDIT = [
  ...PAYMENT_METHODS,
  { id: CREDIT_OPTION_ID, name: "เครดิต" },
];

// บิลขายที่ลูกค้าไปเอาเงินมาจ่ายแป๊บเดียว บิลพักไว้ที่ซ่อมเสร็จสิ้นเหมือนงานซ่อมที่รอจ่าย
export const PAY_LATER_OPTION_ID = "PAY_LATER";
export const SALE_PAYMENT_OPTIONS = [
  ...PAYMENT_OPTIONS_WITH_CREDIT,
  { id: PAY_LATER_OPTION_ID, name: "ชำระทีหลัง" },
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
