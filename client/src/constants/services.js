// บริการเปล่าที่ใส่ให้อัตโนมัติในบิลเช็กช่วงล่าง — ช่างพิมพ์ชื่องานกับใส่ราคาเองทีหลัง
// อ้างด้วยชื่อ ไม่ใช่ id เพราะ id ของแต่ละเครื่องไม่ตรงกัน
export const DEFAULT_LABOR_SERVICE_NAME = "ค่าแรง";

// อะไหล่ที่ซื้อจากร้านอะไหล่มาใช้เลย ไม่ได้เก็บสต็อก จึงไม่มีในคลังให้เลือก
// ใช้รายการเปล่าตัวนี้แล้วพิมพ์ชื่ออะไหล่ทับ เร็วเท่าพิมพ์ในบรรทัดบริการ
// แต่ยังแยกออกได้ว่าเป็นค่าอะไหล่ ไม่ใช่ค่าแรง
export const PART_PLACEHOLDER_SERVICE_NAME = "อะไหล่อื่นๆ";

// รายการที่ตั้งใจให้พิมพ์ชื่อทับตอนเปิดบิล ชื่อในคลังเป็นแค่ป้ายชั่วคราว
// เปิดไดอะล็อกแก้ชื่อแล้วช่องจะว่างไว้ให้พิมพ์ได้เลย ไม่ต้องลบของเดิมก่อน
export const PLACEHOLDER_SERVICE_NAMES = [
  DEFAULT_LABOR_SERVICE_NAME,
  "บริการอื่นๆ",
  PART_PLACEHOLDER_SERVICE_NAME,
];

// บรรทัดนี้เป็นอะไหล่ ไม่ใช่บริการ — ใช้เลือกไอคอนในบิล
// ดูจากธงที่ติดตอนหยิบลงบิล หรือชื่อบริการต้นทาง เพราะชื่อบนบรรทัดถูกพิมพ์ทับไปแล้ว
export const isPartPlaceholderItem = (item) =>
  !!item?.isPartLine ||
  item?.service?.name === PART_PLACEHOLDER_SERVICE_NAME ||
  (!item?.partNumber && item?.name === PART_PLACEHOLDER_SERVICE_NAME);

// รายการที่ใส่ให้เองเมื่อเปิดบิลเช็กช่วงล่าง เพราะทุกบิลมีสองอย่างนี้เสมอ
// เรียงตามลำดับที่อยากให้อยู่ในบิล และอ้างด้วยชื่อเหมือนกัน เครื่องไหนไม่มีก็แค่ข้ามไป
export const SUSPENSION_DEFAULT_SERVICE_NAMES = [
  DEFAULT_LABOR_SERVICE_NAME,
  "ตั้งศูนย์",
];

// ส่วนลดท้ายบิล เก็บเป็นบรรทัดหนึ่งในบิลที่ราคาติดลบ
// ยอดรวมจึงบวกกันตรงๆ ได้เหมือนบรรทัดอื่น ไม่ต้องมีช่องส่วนลดแยกและไม่ต้องแก้ตารางบิล
export const DISCOUNT_SERVICE_NAME = "ส่วนลด";

export const isDiscountItem = (item) =>
  !!item?.isDiscountLine ||
  item?.service?.name === DISCOUNT_SERVICE_NAME ||
  (!item?.partNumber && item?.name === DISCOUNT_SERVICE_NAME);

// รายการที่ไม่ได้อยู่หมวดไหน โผล่รวมกันเหนือกลุ่มบริการตอนดูทั้งหมด
// เรียงตามลำดับนี้ ไม่ใช่ลำดับที่เซิร์ฟเวอร์ส่งมา
export const isNoCategoryItem = (item) =>
  isPartPlaceholderItem(item) || isDiscountItem(item);

export const NO_CATEGORY_ORDER = [
  PART_PLACEHOLDER_SERVICE_NAME,
  DISCOUNT_SERVICE_NAME,
];

// บริการที่เลือกแยกซ้าย-ขวาได้จากแท็บตำแหน่งในบิลเช็กช่วงล่าง
// คิดเป็นรายข้างเหมือนอะไหล่ จึงอยู่ท้ายแท็บนั้นแทนที่จะให้ไปหาเองในรายการซ่อมเพิ่มเติม
export const PER_SIDE_SERVICE_NAME = "ตั้งลูกปืนล้อ";

// บริการทุกตัวแก้ชื่อในบิลได้ ไม่ใช่แค่รายการที่ตั้งราคาไว้ 0
// เพราะงานหน้าร้านมักไม่ตรงกับชื่อในคลังเป๊ะๆ (ปะยางรถยนต์ → ปะยางหน้าซ้าย 2 รู)
// ชื่อที่พิมพ์ถูกเก็บลงบิลใบนั้นใบเดียว ไม่กระทบชื่อในคลัง
export const isFreeformService = (item) =>
  item?.category?.name === "บริการ" && !isDiscountItem(item);

// ลำดับที่ร้านหยิบใช้บ่อย เรียงตามกลุ่มงาน: รายการเปล่า → ปะยาง → งานล้อ → งานตรวจเช็ก
// บริการที่ไม่อยู่ในลิสต์ (เช่นค่าแรงเปลี่ยนอะไหล่ต่างๆ) ตกไปท้ายสุด เรียงตามตัวอักษรไทย
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
  "ปะยางรถมอเตอร์ไซค์ (ไหมเสียบ)",
  "ปะยางรถมอเตอร์ไซค์ (สตรีมเย็น)",
  "ปะยางนอกรถหกล้อ",
  "ปะยางในรถหกล้อ (สตรีมร้อน)",
  "ปะยางในรถไถ ล้อหน้า (สตรีมเย็น)",
  "ถอด-ใส่ยาง",
  "ถอด-ใส่ยาง (มอเตอร์ไซค์)",
  "ถอด-ใส่ยาง (ร้านมอเตอร์ไซค์)",
  "ถ่วงล้อ",
  "สลับยาง+ถ่วงล้อ",
  "ตั้งศูนย์",
  "เป่ากรองอากาศ",
  "เติมลม",
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
