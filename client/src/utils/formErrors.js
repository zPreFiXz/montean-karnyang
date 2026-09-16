// ข้อความผิดพลาดชิ้นแรกจากโครงสร้าง errors ของฟอร์ม
// errors ซ้อนกันได้หลายชั้น (เช่น attributes.width หรือ tireLots[0].quantity)
// จึงไล่ลงไปจนเจอ message แรก แทนที่จะอ่านเฉพาะชั้นบนสุด
export const firstErrorMessage = (errors) => {
  if (!errors || typeof errors !== "object") return null;
  if (typeof errors.message === "string" && errors.message) {
    return errors.message;
  }

  for (const value of Object.values(errors)) {
    const found = firstErrorMessage(value);
    if (found) return found;
  }

  return null;
};
