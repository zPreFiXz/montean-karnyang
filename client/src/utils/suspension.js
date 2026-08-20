// อะไหล่ช่วงล่างตอบคำถามเดียวคือ "ชิ้นนี้แยกซ้าย-ขวาไหม" — หน้าเช็กช่วงล่างใช้ค่านี้
// ตัดสินว่าจะให้เลือกอะไหล่ตัวนั้นในช่องซ้าย/ขวา หรือช่องอื่นๆ
//
// ค่าใหม่คือ attributes.perSide (true/false) ส่วนค่าเก่าคือ attributes.suspensionType
// ที่เป็นสตริง "left-right" / "other" ซึ่งสะกดชนกับ side ของรายการซ่อมจนอ่านโค้ดแล้วสับสน
// ยังอ่านค่าเก่าได้อยู่ เผื่อมีข้อมูลที่ยังไม่ได้ย้าย
export const isPerSide = (attributes) => {
  if (!attributes) return false;
  if (typeof attributes.perSide === "boolean") return attributes.perSide;
  return attributes.suspensionType === "left-right";
};

// ตัวเลือกในฟอร์ม — เก็บลง attributes เป็น perSide แบบ true/false
export const SIDE_OPTIONS = [
  { id: "per-side", name: "แยกซ้าย-ขวา" },
  { id: "single", name: "ไม่แยกข้าง" },
];

export const toPerSide = (optionId) => optionId === "per-side";
export const toSideOptionId = (attributes) =>
  isPerSide(attributes) ? "per-side" : "single";
