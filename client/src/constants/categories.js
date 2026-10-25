import {
  isGearOilItem,
  isLooseEngineOilItem,
  isMultiUseOil,
} from "@/utils/oil";
export const SERVICE_CATEGORY = "บริการ";
export const SUSPENSION_CATEGORY = "ช่วงล่าง";

export const TIRE_CATEGORIES = ["ยาง", "ยางเปอร์เซ็นต์"];
export const USED_TIRE_CATEGORY = "ยางเปอร์เซ็นต์";

export const isTireCategoryName = (name) => TIRE_CATEGORIES.includes(name);

// ล็อตตามสัปดาห์/ปีผลิตเฉพาะยางใหม่ ยางมือสองนับจำนวนตรงๆ
export const tracksTireLots = (name) =>
  isTireCategoryName(name) && name !== USED_TIRE_CATEGORY;

export const OIL_CATEGORY = "น้ำมัน";

// น้ำมันเกียร์ เฟืองท้าย และน้ำมันเครื่องขวดลิตรเปิดตวงขายเป็นลิตรได้
export const allowsDecimalQuantity = (item) =>
  isGearOilItem(item) || isMultiUseOil(item) || isLooseEngineOilItem(item);

// ใช้แทนการเช็กรหัสหมวดหมู่ตรงๆ ในตัวตรวจข้อมูล เพราะรหัสของแต่ละเครื่องไม่ตรงกัน
export const getCategoryKind = (name) => {
  if (name === SERVICE_CATEGORY) return "service";
  if (name === SUSPENSION_CATEGORY) return "suspension";
  if (name === USED_TIRE_CATEGORY) return "usedTire";
  if (isTireCategoryName(name)) return "tire";
  return "part";
};

// หมวดที่มีของแยกซ้าย-ขวา ฟอร์มอะไหล่จึงมีช่องเลือกข้าง เพิ่มหมวดที่นี่ถ้ามีของแยกข้างในหมวดใหม่
export const PER_SIDE_CATEGORIES = [
  "เบรก",
  "โช้คอัพ",
  "ระบบไฟฟ้า",
  "ใบปัดน้ำฝน",
];

// หมวดหมู่ที่อะไหล่ผูกกับรุ่นรถ — หมวดอื่น (น้ำมัน, ยาง ฯลฯ) ใช้ได้ทั่วไปจึงไม่ต้องระบุรุ่นรถที่ใส่ได้
export const VEHICLE_COMPATIBLE_CATEGORIES = [
  "ช่วงล่าง",
  "เบรก",
  "โช้คอัพ",
  "ระบบส่งกำลัง",
  "กรอง",
  "ไส้กรอง",
];
