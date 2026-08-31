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

// บรรทัดบนของการ์ด: ทะเบียนรถ หรือบอกว่าบิลนี้ไม่ได้ผูกกับรถเพราะอะไร
export const getRepairTitle = (repair, formatProvince = (v) => v) => {
  if (isSaleRepair(repair)) return SALE_TITLE;
  if (isNoVehicleRepair(repair)) return NO_VEHICLE_TITLE;

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
