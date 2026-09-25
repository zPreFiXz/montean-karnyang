import { isUnlimitedStockItem } from "@/utils/oil";
// ชื่อหมวดหมู่ที่โค้ดต้องรู้จัก เก็บไว้ที่เดียวเพราะมีหลายหน้าเช็กชื่อเดียวกัน
export const SERVICE_CATEGORY = "บริการ";
export const SUSPENSION_CATEGORY = "ช่วงล่าง";

// ยางใหม่กับยางเปอร์เซ็นต์ (ยางมือสอง) กรอกขนาดหน้ายาง/แก้มยาง/ขอบ และนับเป็นเส้นเหมือนกัน
export const TIRE_CATEGORIES = ["ยาง", "ยางเปอร์เซ็นต์"];
export const USED_TIRE_CATEGORY = "ยางเปอร์เซ็นต์";

export const isTireCategoryName = (name) => TIRE_CATEGORIES.includes(name);

// สต็อกเป็นล็อตตามสัปดาห์/ปีผลิตเฉพาะยางใหม่ ยางมือสองเส้นเดียวไม่มีล็อตให้ไล่ขายเก่าก่อน
// จึงนับจำนวนตรงๆ เหมือนอะไหล่ทั่วไป
export const tracksTireLots = (name) =>
  isTireCategoryName(name) && name !== USED_TIRE_CATEGORY;

// น้ำมันตวงขายเป็นลิตร ครึ่งลิตรก็ขายได้ หมวดอื่นนับเป็นชิ้นจึงเป็นจำนวนเต็มเสมอ
export const OIL_CATEGORY = "น้ำมัน";

// น้ำมันเกียร์ตวงจากถังใหญ่ จึงเบิกเป็นลิตรครึ่งลิตรได้
// ที่เหลือขายเป็นขวดหรือชิ้น จำนวนต้องเป็นจำนวนเต็ม
export const allowsDecimalQuantity = (item) => isUnlimitedStockItem(item);

// ใช้แทนการเช็กรหัสหมวดหมู่ตรงๆ ในตัวตรวจข้อมูล เพราะรหัสของแต่ละเครื่องไม่ตรงกัน
export const getCategoryKind = (name) => {
  if (name === SERVICE_CATEGORY) return "service";
  if (name === SUSPENSION_CATEGORY) return "suspension";
  if (name === USED_TIRE_CATEGORY) return "usedTire";
  if (isTireCategoryName(name)) return "tire";
  return "part";
};

// หมวดหมู่ที่อะไหล่ผูกกับรุ่นรถ — หมวดอื่น (น้ำมัน, ยาง ฯลฯ) ใช้ได้ทั่วไปจึงไม่ต้องระบุรุ่นรถที่ใส่ได้
export const VEHICLE_COMPATIBLE_CATEGORIES = [
  "ช่วงล่าง",
  "เบรก",
  "โช๊คอัพ",
  "ระบบส่งกำลัง",
  "กรอง",
  "ไส้กรอง",
];
