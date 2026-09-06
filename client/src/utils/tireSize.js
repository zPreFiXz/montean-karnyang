// ยางเรเดียลคั่นด้วย R (195/65R15) ยางผ้าใบคั่นด้วยขีด (8.25-16)
// เก็บชนิดโครงยางไว้ใน attributes.construction ของยางแต่ละเส้น
// ไม่มีค่า = เรเดียล เพราะยางเกือบทั้งคลังเป็นเรเดียล และยางเก่าที่บันทึกไว้ก่อนหน้านี้ก็เป็นแบบนั้น
export const RADIAL = "R";
export const BIAS = "-";
export const DEFAULT_TIRE_CONSTRUCTION = RADIAL;

export const TIRE_CONSTRUCTIONS = [
  { id: RADIAL, label: "R", hint: "เรเดียล" },
  { id: BIAS, label: "-", hint: "ผ้าใบ" },
];

export const tireSeparator = (attributes) =>
  attributes?.construction === BIAS ? BIAS : RADIAL;

// ขนาดยางเป็นข้อความเดียว — ยางบรรทุกไม่มีแก้มยาง (8.25-16) จึงเหลือแค่หน้ายางกับขอบ
export const formatTireSize = (attributes) => {
  const width = String(attributes?.width ?? "").trim();
  const rimDiameter = String(attributes?.rimDiameter ?? "").trim();
  if (!width || !rimDiameter) return "";

  const aspectRatio = String(attributes?.aspectRatio ?? "").trim();
  const separator = tireSeparator(attributes);

  return aspectRatio
    ? `${width}/${aspectRatio}${separator}${rimDiameter}`
    : `${width}${separator}${rimDiameter}`;
};

// ชื่อที่แสดงบนการ์ดและในบิล: ยี่ห้อ + ขนาด (เฉพาะยาง) + รุ่น
export const formatProductName = ({ brand, name, attributes, isTire }) =>
  [brand, isTire ? formatTireSize(attributes) : "", name]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" ");
