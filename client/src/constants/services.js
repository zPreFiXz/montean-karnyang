// อ้างด้วยชื่อ ไม่ใช่ id เพราะ id ของแต่ละเครื่องไม่ตรงกัน
export const DEFAULT_LABOR_SERVICE_NAME = "ค่าแรง";

// อะไหล่ที่ซื้อมาใช้เลย ไม่มีในคลัง ใช้รายการนี้แล้วพิมพ์ชื่อทับ
export const PART_PLACEHOLDER_SERVICE_NAME = "อะไหล่อื่นๆ";

export const SERVICE_PLACEHOLDER_SERVICE_NAME = "บริการอื่นๆ";

export const PLACEHOLDER_SERVICE_NAMES = [
  DEFAULT_LABOR_SERVICE_NAME,
  SERVICE_PLACEHOLDER_SERVICE_NAME,
  PART_PLACEHOLDER_SERVICE_NAME,
];

// ชื่อบนบรรทัดถูกพิมพ์ทับได้ จึงดูจากธงที่ติดตอนลงบิลหรือชื่อบริการต้นทาง
export const isPartPlaceholderItem = (item) =>
  !!item?.isPartLine ||
  item?.service?.name === PART_PLACEHOLDER_SERVICE_NAME ||
  (!item?.partNumber && item?.name === PART_PLACEHOLDER_SERVICE_NAME);

// เก็บเป็นบริการเพราะไม่นับสต็อกและระบบของแถมหาจากบริการ แต่หน้าจอเรียกว่าอะไหล่
// "เปลี่ยนจุ๊บลม" ไม่อยู่ในนี้ เพราะเป็นค่าแรง
export const PART_LIKE_SERVICE_NAMES = ["จุ๊บลม"];

export const canHaveServiceImage = (name) =>
  PART_LIKE_SERVICE_NAMES.includes(String(name || "").trim());

// ใช้ตัดสินหน้าตาอย่างเดียว ต่างจาก isPartPlaceholderItem ที่ใช้จัดกลุ่มด้วย
export const isPartLikeItem = (item) =>
  isPartPlaceholderItem(item) ||
  PART_LIKE_SERVICE_NAMES.includes(item?.service?.name) ||
  (!item?.partNumber && PART_LIKE_SERVICE_NAMES.includes(item?.name));

// เรียงตามลำดับในบิล เครื่องไหนไม่มีก็ข้ามไป
export const SUSPENSION_DEFAULT_SERVICE_NAMES = [
  DEFAULT_LABOR_SERVICE_NAME,
  "ตั้งศูนย์",
];

// ราคาติดลบ ยอดรวมจึงบวกกันตรงๆ ได้ ไม่ต้องมีช่องส่วนลดแยก
export const DISCOUNT_SERVICE_NAME = "ส่วนลด";

export const isDiscountItem = (item) =>
  !!item?.isDiscountLine ||
  item?.service?.name === DISCOUNT_SERVICE_NAME ||
  (!item?.partNumber && item?.name === DISCOUNT_SERVICE_NAME) ||
  // ราคาติดลบมีแต่ส่วนลดเท่านั้น ใช้เป็นตาข่ายรองรับบรรทัดที่ถูกเปลี่ยนชื่อ
  // หรือร่างเก่าที่บันทึกไว้ก่อนระบบจะติดธงบอกชนิดบรรทัด
  Number(item?.sellingPrice ?? item?.unitPrice ?? 0) < 0;

export const SINGLE_QUANTITY_SERVICE_NAMES = [
  DEFAULT_LABOR_SERVICE_NAME,
  "ตั้งศูนย์",
  "สลับยาง+ถ่วงล้อ",
];

// ค่าแรงมักถูกพิมพ์ชื่อทับ จึงดูธงที่ติดตอนหยิบลงบิลหรือชื่อบริการต้นทางก่อนชื่อบนบรรทัด
export const isSingleQuantityItem = (item) =>
  !!item?.isSingleLine ||
  SINGLE_QUANTITY_SERVICE_NAMES.includes(item?.service?.name) ||
  (!item?.partNumber && SINGLE_QUANTITY_SERVICE_NAMES.includes(item?.name));

// รายการเปล่าที่พิมพ์ชื่อเองไม่มีหน่วยในคลัง จึงมีช่องพิมพ์หน่วยบนการ์ด
const TYPED_UNIT_SERVICE_NAMES = [
  PART_PLACEHOLDER_SERVICE_NAME,
  SERVICE_PLACEHOLDER_SERVICE_NAME,
];

export const hasTypedUnit = (item) =>
  !!item?.isTypedUnitLine ||
  TYPED_UNIT_SERVICE_NAMES.includes(item?.service?.name) ||
  (!item?.partNumber && TYPED_UNIT_SERVICE_NAMES.includes(item?.name));

// ใช้หน่วยที่พิมพ์ไว้ในบิลก่อน ไม่มีค่อยใช้หน่วยในคลังตอนนี้
// รายการเปล่าไม่ใช้หน่วยของตัวบริการ เพราะแต่ละบรรทัดเป็นของคนละอย่าง
export const lineUnit = (item) =>
  item?.itemUnit ||
  item?.part?.unit ||
  (TYPED_UNIT_SERVICE_NAMES.includes(item?.service?.name)
    ? ""
    : item?.service?.unit) ||
  "";

export const isNoCategoryItem = (item) =>
  isPartPlaceholderItem(item) || isDiscountItem(item);

export const NO_CATEGORY_ORDER = [
  PART_PLACEHOLDER_SERVICE_NAME,
  DISCOUNT_SERVICE_NAME,
];

export const PER_SIDE_SERVICE_NAME = "ตั้งลูกปืนล้อ";

// บริการที่ไม่อยู่ในลิสต์ตกไปท้ายสุด เรียงตามตัวอักษรไทย
const SERVICE_ORDER = [
  "อะไหล่อื่นๆ",
  "บริการอื่นๆ",
  "ค่าแรง",
  PART_PLACEHOLDER_SERVICE_NAME,
  "ปะยาง",
  "ปะยาง (แผ่นใหญ่)",
  "อัดกาวขอบแมกซ์",
  "จุ๊บลม",
  "เปลี่ยนจุ๊บลม",
  "ถ่วงล้อ",
  "สลับยาง+ถ่วงล้อ",
  "ตั้งศูนย์",
  "ตั้งศูนย์ 4 ล้อ",
  "ปะยางรถมอเตอร์ไซค์ (ไหมเสียบ)",
  "ปะยางรถมอเตอร์ไซค์ (สตรีมเย็น)",
  "ปะยางนอกรถหกล้อ",
  "ปะยางในรถหกล้อ (สตรีมร้อน)",
  "ปะยางในรถไถ ล้อหน้า (สตรีมเย็น)",
  "ถอด-ใส่ยาง",
  "ถอด-ใส่ยาง (มอเตอร์ไซค์)",
  "ถอด-ใส่ยาง (ร้านมอเตอร์ไซค์)",
  "เปลี่ยนยาง (มอเตอร์ไซค์)",
  "เป่ากรองอากาศ",
  "เช็กเดินทางไกล",
];

const serviceCollator = new Intl.Collator("th");

export const sortServices = (items = []) =>
  [...items].sort((a, b) => {
    const rankOf = (name) => {
      const index = SERVICE_ORDER.indexOf(name);
      return index === -1 ? SERVICE_ORDER.length : index;
    };

    const diff = rankOf(a.name) - rankOf(b.name);
    return diff !== 0 ? diff : serviceCollator.compare(a.name, b.name);
  });

// อ้างด้วยชื่อ เพราะรหัสของแต่ละเครื่องไม่ตรงกัน
export const TIRE_FREEBIE_NAMES = ["จุ๊บลม", "ถ่วงล้อ"];
export const TIRE_ALIGNMENT_FREEBIE_NAME = "ตั้งศูนย์";
export const ALIGNMENT_FREE_TIRE_COUNT = 4;
// ถ่วงล้อแถมได้มากสุดสองล้อ ต่อให้ซื้อยางสี่เส้น
export const MAX_FREE_BALANCING = 2;

export const freebieQuantityFor = (name, tireCount) => {
  if (name === TIRE_ALIGNMENT_FREEBIE_NAME) {
    return tireCount >= ALIGNMENT_FREE_TIRE_COUNT ? 1 : 0;
  }
  if (name === "ถ่วงล้อ") return Math.min(tireCount, MAX_FREE_BALANCING);
  return tireCount;
};
