// ร้านตั้งชื่อน้ำมันโดยใส่ขนาดบรรจุไว้ในวงเล็บ เช่น "(1L) น้ำมันเครื่อง SUPER COMMONRAIL"
// จึงอ่านขนาดจากชื่อได้เลย ไม่ต้องเพิ่มฟิลด์ในฐานข้อมูล
// รับทั้ง L ตัวใหญ่เล็ก มีเว้นวรรคหรือไม่มี และทศนิยม (0.5L)
const OIL_SIZE_PATTERN = /\(\s*(\d+(?:\.\d+)?)\s*L\s*\)/i;

export const getOilSize = (name) => {
  const matched = OIL_SIZE_PATTERN.exec(String(name || ""));
  return matched ? `${Number(matched[1])}L` : "";
};

// เรียงตามปริมาตรจริง ไม่ใช่ตามตัวอักษร ไม่งั้น 20L จะมาก่อน 4L
export const sortOilSizes = (sizes = []) =>
  [...sizes].sort((a, b) => parseFloat(a) - parseFloat(b));

// ของที่ตวงจากถังใหญ่ ไม่ได้นับเป็นชิ้น สต็อกในระบบจึงไม่ใช่เพดานของการเบิก
// เทียบด้วยคำที่อยู่ในชื่อ เพราะชื่อจริงมียี่ห้อกับขนาดต่อท้าย ("VALVOLINE น้ำมันเกียร์ (4L)")
export const UNLIMITED_STOCK_KEYWORDS = ["น้ำมันเกียร์"];

export const isUnlimitedStockItem = (item) => {
  const name = String(item?.name || item?.itemName || "");
  return UNLIMITED_STOCK_KEYWORDS.some((keyword) => name.includes(keyword));
};
