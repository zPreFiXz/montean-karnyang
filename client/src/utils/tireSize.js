// ไม่มีค่า = เรเดียล เพราะยางเกือบทั้งคลังและยางเก่าที่บันทึกไว้เป็นเรเดียล
export const RADIAL = "R";
export const BIAS = "-";
export const DEFAULT_TIRE_CONSTRUCTION = RADIAL;

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

// ยางเปอร์เซ็นต์ลูกค้าถามหาแค่ขนาด จึงเป็น "ยางเปอร์เซ็นต์ 215/70R15"
// ต้องตรงกับ buildPartItemName ฝั่งเซิร์ฟเวอร์
export const formatProductName = ({
  brand,
  name,
  attributes,
  isTire,
  isUsedTire = false,
}) => {
  const size = isTire ? formatTireSize(attributes) : "";
  if (isUsedTire && size) return `ยางเปอร์เซ็นต์ ${size}`;

  return [brand, size, name]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" ");
};
