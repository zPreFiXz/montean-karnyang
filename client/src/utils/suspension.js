// ค่าใหม่คือ attributes.perSide ค่าเก่าคือ attributes.suspensionType ("left-right" / "other")
// ยังอ่านค่าเก่าได้ เผื่อมีข้อมูลที่ยังไม่ได้ย้าย
export const isPerSide = (attributes) => {
  if (!attributes) return false;
  if (typeof attributes.perSide === "boolean") return attributes.perSide;
  return attributes.suspensionType === "left-right";
};

export const SIDE_OPTIONS = [
  { id: "per-side", name: "แยกซ้าย-ขวา" },
  { id: "single", name: "ไม่แยกข้าง" },
];

export const toPerSide = (optionId) => optionId === "per-side";
export const toSideOptionId = (attributes) =>
  isPerSide(attributes) ? "per-side" : "single";

// ชื่ออะไหล่ช่วงล่างขึ้นต้นด้วยชนิดของมันเสมอ จึงใช้คำแรกเป็นชนิดได้
// ตั้งชื่อไม่ตามแบบแผน อะไหล่ตัวนั้นจะกลายเป็นชนิดของตัวเอง
export const getPartType = (name) =>
  String(name || "")
    .trim()
    .split(/\s+/)[0] || "อื่นๆ";

// ลำดับที่ช่างไล่ตรวจจริง ชนิดที่ไม่อยู่ในลิสต์ตกไปท้ายสุด
export const SUSPENSION_PART_TYPE_ORDER = [
  "ลูกหมากปีกนกบน",
  "สลักปีกนกบน",
  "ลูกหมากปีกนกล่าง",
  "ลูกหมากแร็ค",
  "ยางกันฝุ่นแร็ค",
  "คันชักนอก",
  "คันชักนอก-ใน",
  "บูชปีกนกบน",
  "บูชปีกนกล่าง",
  "บูชปีกนกล่าง (เล็ก)",
  "บูชปีกนกล่าง (ใหญ่)",
  "สลักปีกนกล่าง",
  "ลูกหมากกันโคลงหน้า",
  "สกรูกันโคลง",
  "ยางกันโคลง",
];

const typeCollator = new Intl.Collator("th", { numeric: true });

export const suspensionTypeRank = (type) => {
  const index = SUSPENSION_PART_TYPE_ORDER.indexOf(type);
  return index === -1 ? SUSPENSION_PART_TYPE_ORDER.length : index;
};

export const compareSuspensionTypes = (a, b) =>
  suspensionTypeRank(a) - suspensionTypeRank(b) || typeCollator.compare(a, b);

export const groupPartsByType = (parts) => {
  const groups = new Map();
  for (const part of parts) {
    const type = getPartType(part.name);
    if (!groups.has(type)) groups.set(type, []);
    groups.get(type).push(part);
  }
  return [...groups.entries()]
    .map(([type, items]) => ({ type, items }))
    .sort((a, b) => compareSuspensionTypes(a.type, b.type));
};

// สามชนิดที่ช่างไล่ตรวจประจำในแท็บอื่นๆ ขึ้นก่อน ที่เหลือเรียงตามตัวอักษร
const OTHER_TAB_ORDER = ["คันส่งกลาง", "โช้คหน้า", "โช้คหลัง"];

export const groupOtherParts = (parts) => {
  const rank = (type) => {
    const index = OTHER_TAB_ORDER.indexOf(type);
    return index === -1 ? OTHER_TAB_ORDER.length : index;
  };
  return groupPartsByType(parts).sort(
    (a, b) =>
      rank(a.type) - rank(b.type) || typeCollator.compare(a.type, b.type),
  );
};

export const SUSPENSION_TABS = ["left", "right", "other"];
