// บิลในระบบมีสองแบบ: งานซ่อมที่ผูกกับรถ กับการขายอะไหล่หน้าร้านที่ลูกค้าไม่ได้เอารถมา
// เช็คทั้ง type และ vehicle เพราะบิลเก่าก่อนมีประเภท SALE ยังผูกรถไว้เสมอ
export const isSaleRepair = (repair) =>
  repair?.type === "SALE" || !repair?.vehicle;

export const SALE_TITLE = "ขายอะไหล่หน้าร้าน";

// ยี่ห้อ "อื่นๆ" เป็นตัวแทนของรถที่ไม่มีในรายการ ชื่อยี่ห้อจึงไม่มีความหมาย แสดงแต่รุ่น
export const getDisplayBrand = (vehicleModel) => {
  const brand = vehicleModel?.brand || "";
  const model = vehicleModel?.model || "";

  if (brand === "อื่นๆ" || brand === "อื่น ๆ") return model;
  return `${brand} ${model}`.trim();
};

// บรรทัดบนของการ์ด: ทะเบียนรถ หรือบอกว่าเป็นบิลขายหน้าร้าน
export const getRepairTitle = (repair, formatProvince = (v) => v) => {
  if (isSaleRepair(repair)) return SALE_TITLE;

  const plate = repair?.vehicle?.licensePlate;
  if (plate?.plateNumber && plate?.province) {
    return `${plate.plateNumber} ${formatProvince(plate.province)}`;
  }
  return "ไม่ระบุทะเบียนรถ";
};

// บรรทัดล่าง: ยี่ห้อกับรุ่นรถ หรือชื่อลูกค้าสำหรับบิลขายหน้าร้าน
export const getRepairSubtitle = (repair) => {
  if (isSaleRepair(repair)) return repair?.customer?.name || "ลูกค้าทั่วไป";
  return getDisplayBrand(repair?.vehicle?.vehicleModel);
};
