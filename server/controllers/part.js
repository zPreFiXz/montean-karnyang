const prisma = require("../config/prisma");
const { buildPartItemName } = require("../utils/repairItemName");
const createError = require("../utils/createError");

// ยางส่งมาเป็นล็อต [{ dotCode, quantity }] — สต็อกรวม = ผลรวมทุกล็อต (stockQuantity เป็นตัวเลขหลักที่ต้องตรงกับล็อตเสมอ)
const normalizeLots = (tireLots) =>
  Array.isArray(tireLots)
    ? tireLots
        .map((lot) => ({
          dotCode: String(lot.dotCode || "").trim(),
          quantity: Math.max(0, Number(lot.quantity) || 0),
        }))
        // จำนวน 0 = ล็อตที่ไม่มีของแล้ว ตัดทิ้งเหมือนไม่ได้กรอก (เทียบเท่ากับที่ตัดสต็อกจนหมดแล้วลบล็อต)
        .filter((lot) => lot.dotCode && lot.quantity > 0)
    : null;

const sumLotQuantity = (lots) =>
  lots.reduce((total, lot) => total + lot.quantity, 0);

exports.listParts = async (req, res) => {
  const parts = await prisma.part.findMany({
    include: {
      category: true,
    },
  });

  res.json(parts);
};

// ห้ามผูกกับตัวเอง ไม่งั้นขายแล้วตัดสต็อกวนที่ตัวเดิม
const oilKitFields = (oilSourceId, oilLiters, selfId) => {
  if (oilSourceId && oilSourceId === selfId) {
    createError(400, "ชุดน้ำมันผูกกับตัวเองไม่ได้");
  }
  return oilSourceId
    ? { oilSourceId, oilLiters }
    : { oilSourceId: null, oilLiters: null };
};

const partDataFrom = (body, lots, selfId) => ({
  partNumber: body.partNumber,
  // ไม่มียี่ห้อเก็บเป็น null อย่างเดียว ไม่ปนกับค่าว่าง
  brand: body.brand?.trim() || null,
  name: body.name,
  costPrice: body.costPrice,
  sellingPrice: body.sellingPrice,
  unit: body.unit,
  stockQuantity: lots ? sumLotQuantity(lots) : body.stockQuantity,
  minStockLevel: body.minStockLevel,
  attributes: body.attributes,
  compatibleVehicles: body.compatibleVehicles,
  description: body.description || null,
  publicId: body.image?.publicId,
  secureUrl: body.image?.secureUrl,
  categoryId: body.categoryId,
  ...oilKitFields(body.oilSourceId, body.oilLiters, selfId),
});

exports.createPart = async (req, res) => {
  const { partNumber, tireLots } = req.body;

  const part = await prisma.part.findUnique({
    where: { partNumber },
  });

  if (part) {
    createError(400, "รหัสอะไหล่นี้มีอยู่ในระบบแล้ว");
  }

  const lots = normalizeLots(tireLots);

  await prisma.part.create({
    data: {
      ...partDataFrom(req.body, lots),
      tireLots: lots ? { create: lots } : undefined,
    },
  });

  res.json({ message: "เพิ่มอะไหล่เรียบร้อยแล้ว" });
};

exports.updatePart = async (req, res) => {
  const { id } = req.params;
  const { partNumber, tireLots } = req.body;

  const part = await prisma.part.findUnique({
    where: { partNumber },
  });

  if (part && part.id !== Number(id)) {
    createError(400, "รหัสอะไหล่นี้มีอยู่ในระบบแล้ว");
  }

  const lots = normalizeLots(tireLots);

  const data = partDataFrom(req.body, lots, Number(id));

  await prisma.$transaction(async (tx) => {
    const before = await tx.part.findUnique({
      where: { id: Number(id) },
      include: { category: true },
    });
    const previousName = buildPartItemName(before);

    // ลบล็อตเก่าเสมอ รวมถึงตอนย้ายยางไปหมวดที่กรอกจำนวนตรงๆ ไม่งั้นตอนขายจะตัดจากล็อตที่ไม่ตรงกับสต็อก
    await tx.tireLot.deleteMany({ where: { partId: Number(id) } });
    if (lots) data.tireLots = { create: lots };
    const part = await tx.part.update({
      where: { id: Number(id) },
      data,
      include: { category: true },
    });

    // ชื่อในบิลตามชื่อในคลัง ยกเว้นบรรทัดที่ถูกพิมพ์ชื่อทับ (ชื่อยังตรงกับที่ระบบเคยประกอบ = ไม่เคยถูกแก้)
    // บริการไม่ทำแบบนี้ เพราะชื่อบนบรรทัดบริการช่างพิมพ์เอง
    await tx.repairItem.updateMany({
      where: { partId: Number(id), itemName: previousName },
      data: { itemName: buildPartItemName(part) },
    });
  });

  res.json({ message: "แก้ไขอะไหล่เรียบร้อยแล้ว" });
};

exports.updatePartStock = async (req, res) => {
  const { id } = req.params;
  const { quantity, dotCode, lots: rawLots } = req.body;
  const partId = Number(id);

  const lots = normalizeLots(rawLots) || normalizeLots([{ dotCode, quantity }]);
  const addQty = lots.length ? sumLotQuantity(lots) : Number(quantity) || 0;

  if (addQty <= 0) {
    createError(400, "จำนวนที่เพิ่มต้องมากกว่า 0");
  }

  await prisma.$transaction(async (tx) => {
    await tx.part.update({
      where: { id: partId },
      data: { stockQuantity: { increment: addQty } },
    });

    for (const lot of lots) {
      const existingLot = await tx.tireLot.findFirst({
        where: { partId, dotCode: lot.dotCode },
      });
      if (existingLot) {
        await tx.tireLot.update({
          where: { id: existingLot.id },
          data: { quantity: existingLot.quantity + lot.quantity },
        });
      } else {
        await tx.tireLot.create({
          data: { partId, dotCode: lot.dotCode, quantity: lot.quantity },
        });
      }
    }
  });

  res.json({ message: "เพิ่มสต็อกเรียบร้อยแล้ว" });
};

exports.deletePart = async (req, res) => {
  const { id } = req.params;

  // ความสัมพันธ์ตั้งไว้ให้ตัดเป็นค่าว่าง ไม่ได้ห้ามลบ จึงต้องกันตรงนี้ ไม่งั้นข้อมูลในบิลเก่าจะขาด
  const usedInRepair = await prisma.repairItem.findFirst({
    where: { partId: Number(id) },
  });

  if (usedInRepair) {
    createError(400, "ลบไม่ได้ เพราะมีงานซ่อมที่ใช้อะไหล่นี้อยู่");
  }

  await prisma.part.delete({
    where: { id: Number(id) },
  });

  res.json({ message: "ลบอะไหล่เรียบร้อยแล้ว" });
};
