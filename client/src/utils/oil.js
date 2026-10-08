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

// น้ำมันเกียร์/เฟืองท้ายตวงขายเป็นลิตร ใส่ทศนิยมได้ ตัดสต็อกตามจริงเหมือนอะไหล่อื่น
// เทียบด้วยคำที่อยู่ในชื่อ เพราะชื่อบรรทัดในบิลมียี่ห้อนำหน้า ("VALVOLINE น้ำมันเฟืองท้าย (80W90)")
const GEAR_OIL_KEYWORDS = ["น้ำมันเกียร์", "น้ำมันเฟืองท้าย"];

export const isGearOilItem = (item) => {
  const name = String(item?.name || item?.itemName || "");
  return GEAR_OIL_KEYWORDS.some((keyword) => name.includes(keyword));
};

// น้ำมันเครื่องขวดลิตร (ไม่ใช่ชุดน้ำมันเครื่อง+ไส้กรอง) บางทีเปิดขวดตวงเติมเกียร์หรือเติมเพิ่ม
// จึงขายเป็นลิตรครึ่งลิตรได้
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
// ดูจากหมวดน้ำมัน หน่วยลิตร ที่ไม่ใช่ชุดน้ำมัน (มีตัวเก็บ) และไม่ใช่น้ำมันเกียร์ (มีตัวเลือกของตัวเอง)
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
    !isGearOilItem(item)
  );
};

// น้ำมันเกียร์เกรด 80W90/85W140 เติมเฟืองท้ายได้ด้วย ส่วน ATF กับ 75W85 ใช้กับเกียร์อย่างเดียว
const DIFF_CAPABLE_GEAR_OIL = /^น้ำมันเกียร์.*(80W90|85W140)/i;
const GEAR_OIL_USES = ["น้ำมันเกียร์", "น้ำมันเฟืองท้าย"];

// งานที่ให้เลือกตอนหยิบลงบิล ว่างแปลว่าลงบิลเลยไม่ต้องถาม
export const oilUsesOf = (item) =>
  isMultiUseOil(item)
    ? OIL_USES
    : DIFF_CAPABLE_GEAR_OIL.test(String(item?.name || "").trim())
      ? GEAR_OIL_USES
      : [];

// ชื่อบรรทัดในบิลของน้ำมันที่เลือกงานแล้ว ยี่ห้อนำหน้าเหมือนชื่ออะไหล่อื่น
// ตัดชื่องานเดิมในชื่อคลังออกก่อน ไม่งั้นได้ "น้ำมันเฟืองท้าย น้ำมันเกียร์ (80W90)"
export const oilUseLineName = (item, use) =>
  [
    item?.brand,
    use,
    String(item?.name || "").replace(
      /^น้ำมัน(เครื่อง|เกียร์|เฟืองท้าย)\s*/,
      "",
    ),
  ]
    .filter(Boolean)
    .join(" ");
