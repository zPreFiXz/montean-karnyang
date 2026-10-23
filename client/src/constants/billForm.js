// ค่าตั้งต้นของฟอร์มเปิดบิล ใช้ร่วมกันทั้งหน้ากรอกบิลและหน้าเช็กช่วงล่าง

// ฝั่งที่เลือกไว้ ห้อยท้ายชื่อบนการ์ด
export const SUBMIT_FEEDBACK_MS = 400;

// ล้างฟอร์มต้องไล่ชื่อช่องให้ครบ — reset({}) เปล่าๆ ไม่ได้เขียนค่าว่างลงช่องที่ไม่ได้คุมด้วย React
// (ทะเบียน เลขกิโลเมตร รายละเอียด) ข้อความเดิมจึงค้างอยู่บนหน้าจอ
export const EMPTY_FORM = {
  name: "",
  address: "",
  phoneNumber: "",
  taxId: "",
  brand: "",
  model: "",
  plateLetters: "",
  plateNumbers: "",
  province: "",
  fleetNo: "",
  mileage: "",
  description: "",
};

export const CUSTOMER_FIELDS = ["name", "address", "phoneNumber", "taxId"];
