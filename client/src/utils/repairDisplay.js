// บิลในระบบมีสามแบบ
// 1. งานซ่อมที่ผูกกับรถ — มีทะเบียน/รุ่นรถ ไปโผล่ในประวัติรถ
// 2. ขายอะไหล่หน้าร้าน (type = SALE) — ลูกค้าไม่ได้เอารถมา
// 3. งานบริการที่ไม่ต้องเก็บประวัติรถ (ปะยาง เติมลม ถ่วงล้อ) — เป็นงานซ่อมแต่ไม่ผูกกับรถคันไหน
export const isSaleRepair = (repair) => repair?.type === "SALE";

// ไม่มีรถผูกอยู่และไม่ใช่บิลขาย = งานบริการที่ร้านไม่ได้จดว่าเป็นรถคันไหน
export const isNoVehicleRepair = (repair) =>
  !isSaleRepair(repair) && !repair?.vehicle;

// บอกว่าเกิดอะไรขึ้น ไม่ใช่บอกว่าไม่มีอะไร — ใช้คำเดียวกับโหมดในหน้ากรอกบิล
export const SALE_TITLE = "ขายอะไหล่หน้าร้าน";
export const NO_VEHICLE_TITLE = "งานบริการ";

// ยี่ห้อ "อื่นๆ" เป็นตัวแทนของรถที่ไม่มีในรายการ ชื่อยี่ห้อจึงไม่มีความหมาย แสดงแต่รุ่น
export const getDisplayBrand = (vehicleModel) => {
  const brand = vehicleModel?.brand || "";
  const model = vehicleModel?.model || "";

  if (brand === "อื่นๆ" || brand === "อื่น ๆ") return model;
  return `${brand} ${model}`.trim();
};

// งานบริการทุกใบขึ้นหัวว่า "งานบริการ" เหมือนกันหมดจนแยกไม่ออกว่าใบไหนคืองานอะไร
// จึงยกชื่องานในบิลขึ้นมาเป็นหัวแทน แต่เฉพาะงานที่รู้จักในลิสต์นี้เท่านั้น
// ชื่อที่ช่างพิมพ์เองในบิลยาวไม่แน่นอน ขึ้นหัวการ์ดแล้วโดนตัดกลางคำ สู้ขึ้นว่างานบริการไม่ได้
//
// เพิ่มงานใหม่ = เติมชื่อลงลิสต์นี้ให้ตรงกับชื่อในคลังเป๊ะๆ
const CARD_TITLE_SERVICES = [
  "ปะยาง",
  "ปะยาง (แผ่นใหญ่)",
  "ปะยางรถมอเตอร์ไซค์ (ไหมเสียบ)",
  "ปะยางรถมอเตอร์ไซค์ (สตรีมเย็น)",
  "ปะยางในรถไถ ล้อหน้า (สตรีมเย็น)",
  "จุ๊บลม",
  "เปลี่ยนจุ๊บลม",
  "อัดกาวขอบแมกซ์",
];

// ค่าบริการนอกสถานที่ไม่ใช่ชื่องาน เป็นค่าเดินทางที่บวกเพิ่ม จึงไม่เอามาขึ้นหัวการ์ด
// หัวการ์ดบอกแค่ว่าไปทำอะไรมา ส่วนไปทำที่ไหนดูได้ในบิล
const isTravelFeeName = (name) => name.includes("นอกสถานที่");

// อ่านจาก itemName ที่บันทึกไว้ตอนเปิดบิล ไม่ใช่ชื่อในคลังปัจจุบัน เพราะชื่อในคลังถูกแก้ทีหลังได้
const getServiceTitle = (repair) => {
  const items = repair?.repairItems || [];

  // อะไหล่ที่ขายพ่วงไปด้วยไม่ใช่ชื่องาน ไม่เอามาขึ้นหัว
  const names = items
    .filter((item) => !item?.partId)
    .map((item) => (item?.itemName || "").trim())
    .filter(Boolean);

  // งานเดียวกันแยกเป็นสองบรรทัด (คนละราคา) ไม่ต้องขึ้นชื่อซ้ำ
  const works = [...new Set(names)].filter((name) => !isTravelFeeName(name));

  if (works.length === 0) return "";

  // มีงานที่ไม่รู้จักปนอยู่ = ขึ้นชื่อไม่ครบความจริง สู้ขึ้นว่างานบริการไปเลย
  if (works.some((name) => !CARD_TITLE_SERVICES.includes(name))) return "";

  return works.join(" + ");
};

// บรรทัดบนของการ์ด: ทะเบียนรถ หรือบอกว่าบิลนี้ไม่ได้ผูกกับรถเพราะอะไร
export const getRepairTitle = (repair, formatProvince = (v) => v) => {
  if (isSaleRepair(repair)) return SALE_TITLE;
  if (isNoVehicleRepair(repair)) {
    return getServiceTitle(repair) || NO_VEHICLE_TITLE;
  }

  const plate = repair?.vehicle?.licensePlate;
  if (plate?.plateNumber && plate?.province) {
    return `${plate.plateNumber} ${formatProvince(plate.province)}`;
  }
  return "ไม่ระบุทะเบียนรถ";
};

// บรรทัดล่าง: ยี่ห้อกับรุ่นรถ หรือชื่อลูกค้าเมื่อบิลไม่ได้ผูกกับรถ
// บิลที่ไม่ผูกรถทั้งสองแบบใช้คำเดียวกัน เพราะบรรทัดนี้ทำหน้าที่เดียวกันคือบอกว่าเป็นของใคร
export const getRepairSubtitle = (repair) => {
  if (isSaleRepair(repair) || isNoVehicleRepair(repair)) {
    return repair?.customer?.name || "ลูกค้าทั่วไป";
  }
  return getDisplayBrand(repair?.vehicle?.vehicleModel);
};
