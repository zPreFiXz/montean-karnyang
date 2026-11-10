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

// บิลเปลี่ยนยางสี่เส้น ไว้ไล่เติมสิทธิ์ตั้งศูนย์ค้างย้อนหลังให้บิลที่เกิดก่อนมีระบบนี้
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

  // บิลเปลี่ยนยางสี่เส้นทุกใบ บอกว่าตั้งศูนย์ไปแล้วหรือยัง ถ้ายัง หาบิลถัดไปที่มาตั้งศูนย์ไว้ให้จับคู่
  // status: same = ตั้งในบิลเดียวกัน, pending = ค้างไว้ยังไม่มาตั้ง, used = มาตั้งด้วยสิทธิ์แล้ว, none = ไม่มีตั้งศูนย์ในบิล
  const pairs = [];
  for (const list of byVehicle.values()) {
    list.forEach((tireBill, index) => {
      if (tireCount(tireBill) < ALIGNMENT_MIN_TIRES) return;
      const ownLine = alignmentLine(tireBill);
      const laterBills = list.slice(index + 1);
      const usedIn = laterBills.find((repair) =>
        repair.repairItems.some(
          (item) => item.alignmentFromRepairId === tireBill.id,
        ),
      );
      const later =
        usedIn || laterBills.find((repair) => alignmentLine(repair)) || null;
      const laterLine = later && alignmentLine(later);
      const status = usedIn
        ? "used"
        : ownLine?.alignmentDeferred
          ? "pending"
          : ownLine
            ? "same"
            : "none";
      pairs.push({
        vehicle: tireBill.vehicle,
        tireBill: {
          ...brief(tireBill),
          tires: tireCount(tireBill),
          alignmentPrice: ownLine
            ? Number(ownLine.unitPrice) * Number(ownLine.quantity)
            : null,
        },
        // ตั้งฟรีในบิลเดียวกัน (0 บาท) แต่มีบิลถัดไปมาตั้งอีก อาจลงตามระบบของแถมแต่ยังไม่ได้ตั้งจริง จึงยังโชว์บิลนั้น
        alignmentBill:
          !later || (status === "same" && Number(ownLine.unitPrice) > 0)
            ? null
            : {
                ...brief(later),
                price: Number(laterLine.unitPrice) * Number(laterLine.quantity),
              },
        status,
      });
    });
  }
  // บิลเปลี่ยนยางใหม่สุดอยู่บน
  return pairs.sort(
    (a, b) => new Date(b.tireBill.createdAt) - new Date(a.tireBill.createdAt),
  );
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
  lateAlignmentPairs,
};
