export const SUBMIT_FEEDBACK_MS = 400;

// ต้องไล่ชื่อช่องให้ครบ reset({}) เปล่าๆ ไม่ได้ล้างช่องที่ไม่ได้คุมด้วย React
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
