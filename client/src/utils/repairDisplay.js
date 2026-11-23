import { formatDateShort, formatPlate } from "@/utils/formats";
// บิลมีสามแบบ: งานซ่อมผูกรถ / ขายอะไหล่ (SALE) / งานบริการที่ไม่ผูกรถ
export const isSaleRepair = (repair) => repair?.type === "SALE";

export const isNoVehicleRepair = (repair) =>
  !isSaleRepair(repair) && !repair?.vehicle;

export const SALE_TITLE = "ขายอะไหล่";
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
    .join(" | ");

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

  // มีอะไหล่จากสต็อกปนอยู่ (เช่น ยางใหม่ + จุ๊บลม) ชื่องานบริการไม่ใช่ทั้งบิล จึงขึ้นว่างานบริการ
  if (items.some((item) => item?.partId)) return "";

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

// การ์ดในหน้าที่ทุกบิลเป็นของลูกค้ารายเดียว (หน้าลูกค้าเครดิต, ประวัติบิล) ไม่ต้องขึ้นชื่อลูกค้าซ้ำ
export const getCustomerBillSubtitle = (repair) =>
  [
    repair?.vehicle && getDisplayBrand(repair.vehicle.vehicleModel),
    formatDateShort(repair?.createdAt),
  ]
    .filter(Boolean)
    .join(" | ");

// บิลงานซ่อมที่มีอะไหล่ช่วงล่าง ควรเปิดเป็นเช็กช่วงล่าง ติดป้ายในรายงานยอดขายไว้ให้ตามแก้ทีละบิล
export const hasMisfiledSuspension = (repair) =>
  repair?.type === "GENERAL" &&
  repair.status !== "CANCELLED" &&
  (repair.repairItems || []).some(
    (ri) => ri.part?.category?.name === "ช่วงล่าง",
  );

// ตั้งกำหนดชำระได้เฉพาะบิลที่ยังค้างเงิน: เครดิต หรือรับชำระบางส่วน/มัดจำไว้แล้วแต่ยังไม่จ่ายครบ
// (ต้องตรงกับ canSetPaymentDueDate ใน server/controllers/repair.js)
export const canSetPaymentDueDate = (repair) =>
  repair?.status === "CREDIT" ||
  (["IN_PROGRESS", "COMPLETED"].includes(repair?.status) &&
    Number(repair?.depositAmount) > 0);

// สถานะที่ถอยกลับได้ (แก้สถานะที่กดผิด) เรียงจากใกล้ไปไกล
// (ต้องตรงกับ isStatusRevert ใน server/controllers/repair.js)
const REVERT_ORDER = ["IN_PROGRESS", "COMPLETED", "CREDIT", "PAID"];
export const revertTargetsOf = (repair) => {
  if (!repair || repair.type === "SALE") return [];
  const rank = REVERT_ORDER.indexOf(repair.status);
  if (rank <= 0) return [];
  return REVERT_ORDER.slice(0, rank)
    .reverse()
    .filter(
      // เครดิตได้เฉพาะบิลที่เคยลงเครดิต (มีใบส่งของ) และไม่มีมัดจำ
      (status) =>
        status !== "CREDIT" || (!!repair.deliveryNo && !repair.depositAmount),
    );
};

// เก็บเป็นวันที่ล้วน (DATE) เซิร์ฟเวอร์ส่งมาเป็นเที่ยงคืน UTC เอาแค่ส่วนวันที่มาเทียบ
const dueDateKeyOf = (repair) =>
  String(repair?.paymentDueDate || "").slice(0, 10);

// ป้ายแดงบนการ์ด เฉพาะบิลที่ถึงหรือเกินกำหนดแล้ว จะได้รู้ว่าต้องตามบิลไหน
// บิลที่ยังไม่ถึงกำหนดไม่ขึ้นบนการ์ด ดูวันที่ได้ในหน้ารายละเอียดบิล
export const dueNoteOf = (repair, todayKey) => {
  const dueKey = dueDateKeyOf(repair);
  if (!dueKey || !canSetPaymentDueDate(repair)) return null;
  const days = Math.round(
    (new Date(`${dueKey}T00:00:00Z`) - new Date(`${todayKey}T00:00:00Z`)) /
      86_400_000,
  );
  if (days < 0) return `เกินกำหนดชำระ ${-days} วัน`;
  if (days === 0) return "กำหนดชำระวันนี้";
  return null;
};
