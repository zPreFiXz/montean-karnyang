const prisma = require("../config/prisma");
const { buildPartItemName } = require("../utils/repairItemName");
const createError = require("../utils/createError");
const { destroyImageQuietly } = require("../utils/cloudinaryImage");
const { previewPartLabel, printPartLabel } = require("../utils/printLabel");

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

// ไม่จำกัดสต็อกไม่ตัดไม่นับ ยางนับเป็นล็อต ชุดน้ำมันตัดจากขวดน้ำมัน จึงตั้งไม่ได้
const isUnlimitedStock = (body, lots) =>
  body.unlimitedStock === true && !lots && !body.oilSourceId;

const partDataFrom = (body, lots, selfId) => ({
  partNumber: body.partNumber,
  // ไม่มียี่ห้อเก็บเป็น null อย่างเดียว ไม่ปนกับค่าว่าง
  brand: body.brand?.trim() || null,
  name: body.name,
  costPrice: body.costPrice,
  sellingPrice: body.sellingPrice,
  unit: body.unit,
  ...(isUnlimitedStock(body, lots)
    ? { unlimitedStock: true, stockQuantity: 0, minStockLevel: 0 }
    : {
        unlimitedStock: false,
        stockQuantity: lots ? sumLotQuantity(lots) : body.stockQuantity,
        minStockLevel: body.minStockLevel,
      }),
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
  const target = await prisma.part.findUnique({
    where: { id: partId },
    select: { unlimitedStock: true },
  });
  if (!target) createError(404, "ไม่พบอะไหล่");
  if (target.unlimitedStock) {
    createError(400, "อะไหล่นี้ไม่นับสต็อก จึงเพิ่มจำนวนไม่ได้");
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

const findPartForLabel = async (id) => {
  const part = await prisma.part.findUnique({
    where: { id: Number(id) || 0 },
    include: { category: true },
  });
  if (!part) createError(404, "ไม่พบอะไหล่");
  return part;
};

// รูปตัวอย่างฉลากที่วาดจากข้อมูลชุดเดียวกับที่ส่งเครื่องพิมพ์
exports.previewPartLabel = async (req, res) => {
  const part = await findPartForLabel(req.params.id);
  const image = await previewPartLabel(part, req.body);
  res.json({ image });
};

// บันทึกราคาต้นทุนหลังพิมพ์สำเร็จเท่านั้น เครื่องพิมพ์ไม่พร้อมราคาก็ไม่เปลี่ยน
// แก้ราคาต้นทุนได้เฉพาะผู้ดูแลระบบ (เหมือนฟอร์มแก้ไขอะไหล่) ตรวจก่อนพิมพ์ จะได้ไม่พิมพ์ไปแล้วค่อยปฏิเสธ
exports.printPartLabel = async (req, res) => {
  const part = await findPartForLabel(req.params.id);
  const { saveCostPrice, costPrice } = req.body;
  const shouldSaveCost = saveCostPrice && costPrice != null;
  if (shouldSaveCost && req.user?.role !== "ADMIN") {
    createError(403, "แก้ราคาต้นทุนได้เฉพาะผู้ดูแลระบบ");
  }

  const copies = await printPartLabel(part, req.body);

  if (!shouldSaveCost) {
    return res.json({ message: `สั่งพิมพ์ฉลาก ${copies} แผ่นแล้ว` });
  }
  await prisma.part.update({
    where: { id: part.id },
    data: { costPrice },
  });
  res.json({
    message: `สั่งพิมพ์ฉลาก ${copies} แผ่นแล้ว และบันทึกราคาต้นทุนใหม่ ${costPrice.toLocaleString("th-TH")} บาท`,
    costPrice,
  });
};
