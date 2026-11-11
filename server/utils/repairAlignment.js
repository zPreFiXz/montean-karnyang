const createError = require("./createError");

// สิทธิ์ตั้งศูนย์ฟรีที่ค้างไว้ = บรรทัดตั้งศูนย์ที่ติ๊กค้างไว้ในบิลจริง
// ใช้สิทธิ์แล้ว = มีบรรทัดในบิลจริงอีกใบชี้กลับมาที่บิลนั้น สิทธิ์ผูกกับรถของบิลต้นทาง
// บิลจริง = ไม่ยกเลิกและไม่ใช่ใบเสนอราคา ใบเสนอราคาแค่เสนอ ลูกค้าอาจไม่ตกลง จึงยังไม่ได้หรือใช้สิทธิ์
const ACTIVE = { status: { notIn: ["CANCELLED", "ESTIMATE"] } };

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
      "สิทธิ์ตั้งศูนย์ฟรีนี้ใช้ในบิลอื่นไปแล้ว กรุณาแก้ไขรายการตั้งศูนย์ก่อนบันทึก",
    );
  }
};

// ใบเสนอราคาที่กดใช้สิทธิ์ไว้ ตอนตกลงซ่อมต้องเช็กใหม่ เผื่อบิลอื่นใช้สิทธิ์นั้นไปก่อนแล้ว
const checkRedeemsOnConfirm = async (tx, repairId) => {
  const repair = await tx.repair.findUnique({
    where: { id: repairId },
    select: {
      vehicleId: true,
      repairItems: { select: { alignmentFromRepairId: true } },
    },
  });
  const sourceIds = (repair?.repairItems || [])
    .map((item) => item.alignmentFromRepairId)
    .filter(Boolean);
  if (!sourceIds.length) return;
  const pending = await pendingAlignmentsFor(tx, repair.vehicleId, repairId);
  const pendingIds = new Set(pending.map((source) => source.id));
  if (sourceIds.some((id) => !pendingIds.has(id))) {
    createError(
      400,
      "สิทธิ์ตั้งศูนย์ฟรีนี้ใช้ในบิลอื่นไปแล้ว กรุณาแก้ไขรายการตั้งศูนย์ก่อนเริ่มซ่อม",
    );
  }
};

module.exports = {
  checkRedeemsOnConfirm,
  pendingAlignmentsFor,
  checkAlignmentRedeems,
};
