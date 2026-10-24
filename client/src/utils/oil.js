// อ่านขนาดจากวงเล็บในชื่อ เช่น "(1L) น้ำมันเครื่อง SUPER COMMONRAIL" ไม่มีฟิลด์ในฐานข้อมูล
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

// น้ำมันเครื่องขวดลิตรขายเป็นลิตรครึ่งลิตรได้
// ดูเฉพาะชื่อที่ขึ้นต้นด้วยน้ำมันเครื่อง ไม่งั้นกรองน้ำมันเครื่องหรือแหวนรองน็อตจะใส่ทศนิยมได้ด้วย
const LOOSE_ENGINE_OIL_PATTERN =
  /^(\(\s*\d+(?:\.\d+)?\s*L\s*\)\s*)?น้ำมันเครื่อง/i;

export const isLooseEngineOilItem = (item) =>
  LOOSE_ENGINE_OIL_PATTERN.test(
    String(item?.name || item?.itemName || "").trim(),
  );

// น้ำมันขวดลิตรตัวเดียวใช้ได้หลายงาน ตอนลงบิลถามว่าใช้เติมอะไร ตัดสต็อกที่ตัวเดียวกัน
// ดูจากหมวด หน่วย และไม่ใช่ชุดน้ำมัน ไม่ดูจากชื่อ เพราะชื่อในคลังไม่มีคำว่าน้ำมันเครื่องแล้ว
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

export const oilUsesOf = (item) =>
  isMultiUseOil(item)
    ? OIL_USES
    : DIFF_CAPABLE_GEAR_OIL.test(String(item?.name || "").trim())
      ? GEAR_OIL_USES
      : [];

// ตัดชื่องานเดิมออกก่อน ไม่งั้นได้ "น้ำมันเฟืองท้าย น้ำมันเกียร์ (80W90)"
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
