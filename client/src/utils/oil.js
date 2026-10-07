// ร้านตั้งชื่อน้ำมันโดยใส่ขนาดบรรจุไว้ในวงเล็บ เช่น "(1L) น้ำมันเครื่อง SUPER COMMONRAIL"
// จึงอ่านขนาดจากชื่อได้เลย ไม่ต้องเพิ่มฟิลด์ในฐานข้อมูล
// รับทั้ง L ตัวใหญ่เล็ก มีเว้นวรรคหรือไม่มี และทศนิยม (0.5L)
const OIL_SIZE_PATTERN = /\(\s*(\d+(?:\.\d+)?)\s*L\s*\)/i;

export const getOilSize = (name) => {
  const matched = OIL_SIZE_PATTERN.exec(String(name || ""));
  return matched ? `${Number(matched[1])}L` : "";
};

// ขนาดของน้ำมันสำหรับตัวกรองขนาด อ่านจากชื่อก่อน
// น้ำมันขวดลิตรที่ใช้ได้หลายงานไม่มีขนาดในชื่อแล้ว (ดู isMultiUseOil) แต่เป็นขวด 1 ลิตร จึงนับเป็น 1L
export const oilSizeOf = (item) =>
  getOilSize(item?.name) || (isMultiUseOil(item) ? "1L" : "");

// เรียงตามปริมาตรจริง ไม่ใช่ตามตัวอักษร ไม่งั้น 20L จะมาก่อน 4L
export const sortOilSizes = (sizes = []) =>
  [...sizes].sort((a, b) => parseFloat(a) - parseFloat(b));

// ของที่ตวงจากถังใหญ่ ไม่ได้นับเป็นชิ้น สต็อกในระบบจึงไม่ใช่เพดานของการเบิก
// เทียบด้วยคำที่อยู่ในชื่อ เพราะชื่อจริงมียี่ห้อกับขนาดต่อท้าย ("VALVOLINE น้ำมันเกียร์ (4L)")
export const UNLIMITED_STOCK_KEYWORDS = ["น้ำมันเกียร์", "น้ำมันเฟืองท้าย"];

// น้ำมันเครื่องขวดลิตร (ไม่ใช่ชุดน้ำมันเครื่อง+ไส้กรอง) บางทีเปิดขวดตวงเติมเกียร์หรือเติมเพิ่ม
// จึงขายเป็นลิตรครึ่งลิตรได้ แต่ยังตัดสต็อกตามจริง (ต่างจากน้ำมันเกียร์ที่ตวงจากถังไม่นับสต็อก)
// ดูเฉพาะชื่อที่ขึ้นต้นด้วยน้ำมันเครื่อง (มีขนาดในวงเล็บนำหน้าได้) ไม่งั้นกรองน้ำมันเครื่อง
// หรือแหวนรองน็อตถ่ายน้ำมันเครื่องจะใส่ทศนิยมได้ไปด้วย
const LOOSE_ENGINE_OIL_PATTERN =
  /^(\(\s*\d+(?:\.\d+)?\s*L\s*\)\s*)?น้ำมันเครื่อง/i;

export const isLooseEngineOilItem = (item) =>
  LOOSE_ENGINE_OIL_PATTERN.test(
    String(item?.name || item?.itemName || "").trim(),
  );

// น้ำมันขวดลิตรตัวเดียวใช้ได้หลายงาน ในคลังเก็บแค่ยี่ห้อกับเกรด (เช่น SUPER COMMONRAIL (15W40))
// ตอนหยิบลงบิลถามว่าใช้เติมอะไร แล้วชื่อในบิลเป็น "ยี่ห้อ งาน เกรด" ตัดสต็อกที่ตัวเดียวกันเสมอ
// ดูจากหมวดน้ำมัน หน่วยลิตร ที่ไม่ใช่ชุดน้ำมัน (มีตัวเก็บ) และไม่ใช่น้ำมันจากถังใหญ่ที่ไม่นับสต็อก
// ไม่ดูจากชื่อ เพราะชื่อในคลังไม่มีคำว่าน้ำมันเครื่องแล้ว
export const OIL_USES = ["น้ำมันเครื่อง", "น้ำมันเกียร์", "น้ำมันเฟืองท้าย"];

export const isMultiUseOil = (item) => {
  const categoryName =
    typeof item?.category === "string" ? item.category : item?.category?.name;
  return (
    categoryName === "น้ำมัน" &&
    item?.unit === "ลิตร" &&
    !!item?.partNumber &&
    !item?.oilSourceId &&
    !isUnlimitedStockItem(item)
  );
};

// ชื่อบรรทัดในบิลของน้ำมันที่เลือกงานแล้ว ยี่ห้อนำหน้าเหมือนชื่ออะไหล่อื่น
export const oilUseLineName = (item, use) =>
  [item?.brand, use, item?.name].filter(Boolean).join(" ");

export const isUnlimitedStockItem = (item) => {
  const name = String(item?.name || item?.itemName || "");
  return UNLIMITED_STOCK_KEYWORDS.some((keyword) => name.includes(keyword));
};
