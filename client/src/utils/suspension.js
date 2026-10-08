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

// ชื่ออะไหล่ช่วงล่างขึ้นต้นด้วยชนิดของมันเสมอ (ลูกหมากล่าง D-Max, โช้คหน้า Vigo)
// จึงใช้คำแรกเป็นชนิดได้โดยไม่ต้องเพิ่มฟิลด์ในฐานข้อมูล
// ข้อแลกเปลี่ยน: ตั้งชื่อไม่ตามแบบแผน อะไหล่ตัวนั้นจะกลายเป็นชนิดของตัวเอง
export const getPartType = (name) =>
  String(name || "")
    .trim()
    .split(/\s+/)[0] || "อื่นๆ";

// ลำดับที่ช่างไล่ตรวจช่วงล่างจริง ไม่ใช่ตามตัวอักษร — ชนิดที่ไม่อยู่ในลิสต์ตกไปท้ายสุด
// ใช้ทั้งหน้าเช็กช่วงล่าง หน้าคลัง และหน้าต่างเลือกอะไหล่ลงบิล แก้ที่นี่ที่เดียวเปลี่ยนทุกหน้า
export const SUSPENSION_PART_TYPE_ORDER = [
  "ลูกหมากปีกนกบน",
  "สลักปีกนกบน",
  "ลูกหมากปีกนกล่าง",
  "ลูกหมากแร็ค",
  "ยางกันฝุ่นแร็ค",
  "คันชักนอก",
  "คันชักนอก-ใน",
  "ลูกหมากกันโคลงหน้า",
  "สกรูกันโคลง",
  "ยางกันโคลง",
];

const typeCollator = new Intl.Collator("th", { numeric: true });

// อันดับของชนิดตามลำดับที่ช่างไล่ตรวจ ชนิดที่ไม่อยู่ในลิสต์ไปท้าย
export const suspensionTypeRank = (type) => {
  const index = SUSPENSION_PART_TYPE_ORDER.indexOf(type);
  return index === -1 ? SUSPENSION_PART_TYPE_ORDER.length : index;
};

export const compareSuspensionTypes = (a, b) =>
  suspensionTypeRank(a) - suspensionTypeRank(b) || typeCollator.compare(a, b);
