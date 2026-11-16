const prisma = require("../config/prisma");
const { buildPartItemName } = require("../utils/repairItemName");
const createError = require("../utils/createError");
const { destroyImageQuietly } = require("../utils/cloudinaryImage");

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

  const created = await prisma.part.create({
    data: {
      ...partDataFrom(req.body, lots),
      tireLots: lots ? { create: lots } : undefined,
    },
  });

  // ส่งรหัสกลับไป หน้าเว็บจะเปิดรายละเอียดของชิ้นที่เพิ่งเพิ่มได้
  res.json({
    message: "เพิ่มอะไหล่เรียบร้อยแล้ว",
    id: created.id,
    type: "part",
  });
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
  let replacedPublicId = null;

  await prisma.$transaction(async (tx) => {
    const before = await tx.part.findUnique({
      where: { id: Number(id) },
      include: { category: true },
    });
    const previousName = buildPartItemName(before);
    // publicId ไม่ได้ส่งมา = ไม่แตะรูป ส่งมาแล้วต่างจากเดิม (รวมค่าว่าง) = รูปเดิมไม่มีใครใช้แล้ว
    if (
      data.publicId !== undefined &&
      before?.publicId &&
      before.publicId !== data.publicId
    ) {
      replacedPublicId = before.publicId;
    }

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

  await destroyImageQuietly(replacedPublicId);

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

  const deleted = await prisma.part.delete({
    where: { id: Number(id) },
    select: { publicId: true },
  });
  await destroyImageQuietly(deleted.publicId);

  res.json({ message: "ลบอะไหล่เรียบร้อยแล้ว" });
};

// ยี่ห้อกับชื่อที่เคยใช้ในหมวดนี้ ไว้ให้ฟอร์มเพิ่มอะไหล่แนะนำ ไม่ต้องพิมพ์เองทุกครั้ง
exports.listPartHints = async (req, res) => {
  const categoryId = Number(req.query.categoryId);
  if (!Number.isInteger(categoryId)) {
    createError(400, "หมวดหมู่ไม่ถูกต้อง");
  }

  const parts = await prisma.part.findMany({
    where: { categoryId },
    select: { brand: true, name: true },
  });

  res.json(parts);
};

const brandKeyOf = (brand) =>
  String(brand || "")
    .trim()
    .toLowerCase();

// ยี่ห้อเดียวกันที่พิมพ์ตัวพิมพ์เล็กใหญ่ต่างกัน (เช่น Roky กับ ROKY) ทำให้ค้นหาและกรองยี่ห้อแตกเป็นสองกลุ่ม
exports.listBrandVariants = async (req, res) => {
  const parts = await prisma.part.findMany({
    where: { brand: { not: null } },
    select: { brand: true },
  });

  const groups = new Map();
  for (const { brand } of parts) {
    const key = brandKeyOf(brand);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, new Map());
    const spellings = groups.get(key);
    spellings.set(brand, (spellings.get(brand) || 0) + 1);
  }

  res.json(
    [...groups.entries()]
      .filter(([, spellings]) => spellings.size > 1)
      .map(([key, spellings]) => ({
        key,
        spellings: [...spellings.entries()]
          .map(([brand, count]) => ({ brand, count }))
          .sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => a.key.localeCompare(b.key)),
  );
};

// เปลี่ยนทุกตัวสะกดของยี่ห้อนี้เป็นตัวที่เลือก ชื่อในบิลที่ระบบประกอบไว้เปลี่ยนตามแบบเดียวกับ updatePart
exports.mergeBrandVariants = async (req, res) => {
  const { key, brand } = req.body;
  if (brandKeyOf(brand) !== brandKeyOf(key)) {
    createError(400, "ตัวสะกดใหม่ต้องเป็นยี่ห้อเดียวกัน");
  }

  const parts = await prisma.part.findMany({
    where: { brand: { not: null } },
    include: { category: true },
  });
  const targets = parts.filter(
    (part) =>
      brandKeyOf(part.brand) === brandKeyOf(key) && part.brand !== brand,
  );

  await prisma.$transaction(async (tx) => {
    for (const part of targets) {
      const previousName = buildPartItemName(part);
      const updated = await tx.part.update({
        where: { id: part.id },
        data: { brand },
        include: { category: true },
      });
      await tx.repairItem.updateMany({
        where: { partId: part.id, itemName: previousName },
        data: { itemName: buildPartItemName(updated) },
      });
    }
  });

  res.json({
    message: `แก้ยี่ห้อเป็น ${brand} แล้ว ${targets.length} รายการ`,
    count: targets.length,
  });
};
