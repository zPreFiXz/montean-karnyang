// คู่กับ client/src/utils/tireSize.js — ต้องได้ข้อความเดียวกัน
// เพราะชื่อรายการในบิลถูกประกอบจากฝั่งเซิร์ฟเวอร์ แต่การ์ดในหน้าเว็บประกอบเอง
const BIAS = "-";
const RADIAL = "R";

exports.formatTireSize = (attributes) => {
  const width = String(attributes?.width ?? "").trim();
  const rimDiameter = String(attributes?.rimDiameter ?? "").trim();
  if (!width || !rimDiameter) return "";

  const aspectRatio = String(attributes?.aspectRatio ?? "").trim();
  const separator = attributes?.construction === BIAS ? BIAS : RADIAL;

  return aspectRatio
    ? `${width}/${aspectRatio}${separator}${rimDiameter}`
    : `${width}${separator}${rimDiameter}`;
};
