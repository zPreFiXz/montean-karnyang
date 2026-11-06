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

// ลำดับตั้งต้นที่ช่างไล่ตรวจจริง ใช้ระหว่างรอลำดับที่ร้านจัดไว้ (ตาราง SuspensionTypeOrder)
// ชนิดที่ไม่อยู่ในลำดับตกไปท้ายสุดเรียงตามตัวอักษร
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
  "บูชปีกนกล่าง(เล็ก)",
  "บูชปีกนกล่าง(ใหญ่)",
  "สลักปีกนกล่าง",
  "ลูกหมากกันโคลงหน้า",
  "สกรูกันโคลง",
  "ยางกันโคลง",
];
export const OTHER_TAB_ORDER = ["คันส่งกลาง", "โช้คหน้า", "โช้คหลัง"];
export const DEFAULT_TYPE_ORDER = {
  side: SUSPENSION_PART_TYPE_ORDER,
  other: OTHER_TAB_ORDER,
};

const typeCollator = new Intl.Collator("th", { numeric: true });

export const compareTypesBy = (order) => {
  const rank = (type) => {
    const index = order.indexOf(type);
    return index === -1 ? order.length : index;
  };
  return (a, b) => rank(a) - rank(b) || typeCollator.compare(a, b);
};

export const groupPartsByType = (parts, order = SUSPENSION_PART_TYPE_ORDER) => {
  const groups = new Map();
  for (const part of parts) {
    const type = getPartType(part.name);
    if (!groups.has(type)) groups.set(type, []);
    groups.get(type).push(part);
  }
  const compare = compareTypesBy(order);
  return [...groups.entries()]
    .map(([type, items]) => ({ type, items }))
    .sort((a, b) => compare(a.type, b.type));
};

export const SUSPENSION_TABS = ["left", "right", "other"];
export const TAB_LABELS = { left: "ซ้าย", right: "ขวา", other: "อื่นๆ" };
