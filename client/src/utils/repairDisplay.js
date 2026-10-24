import { formatPlate } from "@/utils/formats";
// บิลมีสามแบบ: งานซ่อมผูกรถ / ขายอะไหล่หน้าร้าน (SALE) / งานบริการที่ไม่ผูกรถ
export const isSaleRepair = (repair) => repair?.type === "SALE";

export const isNoVehicleRepair = (repair) =>
  !isSaleRepair(repair) && !repair?.vehicle;

export const SALE_TITLE = "ขายอะไหล่หน้าร้าน";
export const NO_VEHICLE_TITLE = "งานบริการ";

// ยี่ห้อ "อื่นๆ" เป็นตัวแทนของรถที่ไม่มีในรายการ ชื่อยี่ห้อจึงไม่มีความหมาย แสดงแต่รุ่น
export const getDisplayBrand = (vehicleModel) => {
  const brand = vehicleModel?.brand || "";
  const model = vehicleModel?.model || "";

  if (brand === "อื่นๆ" || brand === "อื่น ๆ") return model;
  return `${brand} ${model}`.trim();
};

// เขียน "เบอร์รถ" เต็ม เพราะ "เบอร์" คำเดียวคนมักอ่านเป็นเบอร์โทร
export const getVehicleSubtitle = (vehicle) =>
  [
    getDisplayBrand(vehicle?.vehicleModel),
    vehicle?.fleetNo && `เบอร์รถ ${vehicle.fleetNo}`,
  ]
    .filter(Boolean)
    .join(" · ");

// ขึ้นชื่องานเป็นหัวการ์ดเฉพาะงานในลิสต์นี้ เพราะชื่อที่พิมพ์เองยาวไม่แน่นอน
// เพิ่มงานใหม่ = เติมชื่อให้ตรงกับชื่อในคลังเป๊ะๆ
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

// ค่าเดินทางที่บวกเพิ่ม ไม่ใช่ชื่องาน
const isTravelFeeName = (name) => name.includes("นอกสถานที่");

// อ่านจาก itemName ที่บันทึกไว้ เพราะชื่อในคลังถูกแก้ทีหลังได้
const getServiceTitle = (repair) => {
  const items = repair?.repairItems || [];

  const names = items
    .filter((item) => !item?.partId)
    .map((item) => (item?.itemName || "").trim())
    .filter(Boolean);

  const works = [...new Set(names)].filter((name) => !isTravelFeeName(name));

  if (works.length === 0) return "";

  // มีงานที่ไม่รู้จักปนอยู่ = ขึ้นชื่อไม่ครบความจริง สู้ขึ้นว่างานบริการไปเลย
  if (works.some((name) => !CARD_TITLE_SERVICES.includes(name))) return "";

  return works.join(" + ");
};

export const getRepairTitle = (repair, formatProvince = (v) => v) => {
  if (isSaleRepair(repair)) return SALE_TITLE;
  if (isNoVehicleRepair(repair)) {
    return getServiceTitle(repair) || NO_VEHICLE_TITLE;
  }

  const plate = repair?.vehicle?.licensePlate;
  if (plate?.plateNumber && plate?.province) {
    return `${formatPlate(plate.plateNumber)} ${formatProvince(plate.province)}`;
  }
  return "ไม่ระบุทะเบียนรถ";
};

export const getRepairSubtitle = (repair) => {
  if (isSaleRepair(repair) || isNoVehicleRepair(repair)) {
    return repair?.customer?.name || "ลูกค้าทั่วไป";
  }
  return getDisplayBrand(repair?.vehicle?.vehicleModel);
};
