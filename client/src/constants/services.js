// บริการเปล่าที่ใส่ให้อัตโนมัติในบิลเช็กช่วงล่าง — ช่างพิมพ์ชื่องานกับใส่ราคาเองทีหลัง
// อ้างด้วยชื่อ ไม่ใช่ id เพราะ id ของแต่ละเครื่องไม่ตรงกัน
export const DEFAULT_LABOR_SERVICE_NAME = "บริการอื่นๆ";

// บริการที่ราคาตั้งต้นเป็น 0 ถือเป็น "รายการเปล่า" — ตั้งใจให้พิมพ์ชื่องานกับใส่ราคาเองในบิล
// เช่น ค่าแรง, ค่าบริการนอกสถานที่, บริการอื่นๆ
// ใช้ราคาเป็นเกณฑ์แทนการไล่จด id ไว้ในโค้ด รายการใหม่ที่ตั้งราคา 0 จึงแก้ชื่อได้เองทันที
export const isFreeformService = (item) => {
  if (item?.category?.name !== "บริการ") return false;

  const basePrice = item?.basePrice ?? item?.sellingPrice;
  return Number(basePrice) === 0;
};

// ลำดับที่ร้านหยิบใช้บ่อย เรียงตามกลุ่มงาน: รายการเปล่า → ปะยาง → งานล้อ → งานตรวจเช็ก
// บริการที่ไม่อยู่ในลิสต์ (เช่นค่าแรงเปลี่ยนอะไหล่ต่างๆ) ตกไปท้ายสุด เรียงตามตัวอักษรไทย
const SERVICE_ORDER = [
  "บริการอื่นๆ",
  "ปะยางรถยนต์",
  "ปะยางแผ่นใหญ่",
  "ปะยางรถมอเตอร์ไซค์ (ไหมเสียบ)",
  "ปะยางรถมอเตอร์ไซค์ (สตริมเย็น)",
  "ปะยางนอกรถหกล้อ",
  "ปะยางในรถหกล้อ",
  "ถอด-ใส่ยาง",
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
