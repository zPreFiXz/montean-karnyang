const createError = require("./createError");

// สิทธิ์ตั้งศูนย์ฟรีที่ค้างไว้ = บรรทัดตั้งศูนย์ที่ติ๊กค้างไว้ในบิลที่ไม่ได้ยกเลิก
// ใช้สิทธิ์แล้ว = มีบรรทัดในบิลอื่นที่ไม่ได้ยกเลิกชี้กลับมาที่บิลนั้น สิทธิ์ผูกกับรถของบิลต้นทาง
const ACTIVE = { status: { not: "CANCELLED" } };

// บิลที่ยังมีสิทธิ์ค้างของรถคันนี้ exceptRepairId = บิลที่กำลังแก้ ไม่นับว่าบิลนั้นใช้สิทธิ์ไปแล้วและไม่เสนอสิทธิ์ของตัวเอง
const pendingAlignmentsFor = async (db, vehicleId, exceptRepairId = null) => {
  if (!vehicleId) return [];
  const sources = await db.repair.findMany({
    where: {
      vehicleId,
      ...ACTIVE,
      ...(exceptRepairId ? { id: { not: exceptRepairId } } : {}),
      repairItems: { some: { alignmentDeferred: true } },
      alignmentRedeems: {
        none: {
          repair: {
            ...ACTIVE,
            ...(exceptRepairId ? { id: { not: exceptRepairId } } : {}),
          },
        },
      },
    },
    select: { id: true, receiptNo: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return sources;
};

// บรรทัดที่บอกว่าใช้สิทธิ์ต้องชี้ไปบิลที่ยังมีสิทธิ์ค้างของรถคันเดียวกัน ห้ามใช้สิทธิ์ซ้ำ
const checkAlignmentRedeems = async (tx, repairItems, vehicleId, repairId) => {
  const sourceIds = (repairItems || [])
    .map((item) => item.alignmentFromRepairId)
    .filter(Boolean);
  if (!sourceIds.length) return;
  if (new Set(sourceIds).size !== sourceIds.length) {
    createError(400, "ใช้สิทธิ์ตั้งศูนย์ฟรีจากบิลเดียวกันซ้ำไม่ได้");
  }
  const pending = await pendingAlignmentsFor(tx, vehicleId, repairId);
  const pendingIds = new Set(pending.map((source) => source.id));
  if (sourceIds.some((id) => !pendingIds.has(id))) {
    createError(
      400,
      "สิทธิ์ตั้งศูนย์ฟรีนี้ใช้ไม่ได้แล้ว กรุณาเปิดบิลใหม่อีกครั้ง",
    );
  }
};

// รถที่เปลี่ยนยางสี่เส้นโดยไม่ได้ตั้งศูนย์ในบิลนั้น แล้วมาตั้งศูนย์ในบิลถัดไป
// ไว้ไล่เติมสิทธิ์ค้างย้อนหลังให้บิลที่เกิดก่อนมีระบบนี้ done = จับคู่สิทธิ์กันแล้ว
const TIRE_CATEGORY = "ยาง";
const ALIGNMENT_NAME = "ตั้งศูนย์";
const ALIGNMENT_MIN_TIRES = 4;

const lateAlignmentPairs = async (db) => {
  const repairs = await db.repair.findMany({
    where: {
      vehicleId: { not: null },
      status: { notIn: ["CANCELLED", "ESTIMATE"] },
    },
    select: {
      id: true,
      receiptNo: true,
      createdAt: true,
      vehicleId: true,
      vehicle: {
        select: {
          licensePlate: { select: { plateNumber: true, province: true } },
          vehicleModel: { select: { brand: true, model: true } },
        },
      },
      repairItems: {
        select: {
          itemName: true,
          quantity: true,
          unitPrice: true,
          alignmentDeferred: true,
          alignmentFromRepairId: true,
          part: { select: { category: { select: { name: true } } } },
          service: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const alignmentLine = (repair) =>
    repair.repairItems.find(
      (item) => (item.service?.name || item.itemName) === ALIGNMENT_NAME,
    );
  const tireCount = (repair) =>
    repair.repairItems
      .filter((item) => item.part?.category?.name === TIRE_CATEGORY)
      .reduce((sum, item) => sum + Number(item.quantity), 0);
  const brief = (repair) => ({
    id: repair.id,
    receiptNo: repair.receiptNo,
    createdAt: repair.createdAt,
  });

  const byVehicle = new Map();
  for (const repair of repairs) {
    if (!byVehicle.has(repair.vehicleId)) byVehicle.set(repair.vehicleId, []);
    byVehicle.get(repair.vehicleId).push(repair);
  }

  const pairs = [];
  for (const list of byVehicle.values()) {
    list.forEach((tireBill, index) => {
      const ownLine = alignmentLine(tireBill);
      if (tireCount(tireBill) < ALIGNMENT_MIN_TIRES) return;
      // จ่ายค่าตั้งศูนย์ในบิลเดียวกัน แปลว่าตั้งไปแล้วจริง ส่วนตั้งศูนย์ฟรี (0 บาท) อาจลงไว้ตามระบบของแถมแต่ยังไม่ได้ตั้ง
      if (ownLine && Number(ownLine.unitPrice) > 0) return;
      const later = list
        .slice(index + 1)
        .find((repair) => alignmentLine(repair));
      if (!later) return;
      const laterLine = alignmentLine(later);
      pairs.push({
        vehicle: tireBill.vehicle,
        tireBill: { ...brief(tireBill), tires: tireCount(tireBill) },
        alignmentBill: {
          ...brief(later),
          price: Number(laterLine.unitPrice) * Number(laterLine.quantity),
        },
        done: laterLine.alignmentFromRepairId === tireBill.id,
      });
    });
  }
  // ที่ยังไม่ได้แก้ขึ้นก่อน ใหม่สุดอยู่บน
  return pairs.sort(
    (a, b) =>
      a.done - b.done ||
      new Date(b.alignmentBill.createdAt) - new Date(a.alignmentBill.createdAt),
  );
};

module.exports = {
  pendingAlignmentsFor,
  checkAlignmentRedeems,
  lateAlignmentPairs,
};
