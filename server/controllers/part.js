const prisma = require("../config/prisma");
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

exports.listParts = async (req, res, next) => {
  try {
    const parts = await prisma.part.findMany({
      include: {
        category: true,
      },
    });

    res.json(parts);
  } catch (error) {
    next(error);
  }
};

exports.createPart = async (req, res, next) => {
  try {
    const {
      partNumber,
      brand,
      name,
      costPrice,
      sellingPrice,
      unit,
      stockQuantity,
      minStockLevel,
      attributes,
      compatibleVehicles,
      description,
      image,
      categoryId,
      tireLots,
    } = req.body;

    const part = await prisma.part.findUnique({
      where: { partNumber },
    });

    if (part) {
      createError(400, "รหัสอะไหล่นี้มีอยู่ในระบบแล้ว");
    }

    const lots = normalizeLots(tireLots);

    await prisma.part.create({
      data: {
        partNumber,
        // ไม่มียี่ห้อเก็บเป็น null อย่างเดียว ไม่ปนกับค่าว่าง
        brand: brand?.trim() || null,
        name,
        costPrice,
        sellingPrice,
        unit,
        stockQuantity: lots ? sumLotQuantity(lots) : stockQuantity,
        minStockLevel,
        attributes,
        compatibleVehicles,
        description: description || null,
        publicId: image?.publicId,
        secureUrl: image?.secureUrl,
        categoryId,
        tireLots: lots ? { create: lots } : undefined,
      },
    });

    res.json({ message: "เพิ่มอะไหล่เรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};

exports.updatePart = async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      partNumber,
      brand,
      name,
      costPrice,
      sellingPrice,
      unit,
      stockQuantity,
      minStockLevel,
      attributes,
      compatibleVehicles,
      description,
      image,
      categoryId,
      tireLots,
    } = req.body;

    const part = await prisma.part.findUnique({
      where: { partNumber },
    });

    if (part && part.id !== Number(id)) {
      createError(400, "รหัสอะไหล่นี้มีอยู่ในระบบแล้ว");
    }

    const lots = normalizeLots(tireLots);

    const data = {
      partNumber,
      brand: brand?.trim() || null,
      name,
      costPrice,
      sellingPrice,
      unit,
      stockQuantity: lots ? sumLotQuantity(lots) : stockQuantity,
      minStockLevel,
      attributes,
      compatibleVehicles,
      description: description || null,
      publicId: image?.publicId,
      secureUrl: image?.secureUrl,
      categoryId,
    };

    // ยาง: แทนที่ล็อตทั้งชุดตามที่ฟอร์มส่งมา (ลบเก่า สร้างใหม่) ใน transaction เดียวกับการอัปเดต Part
    await prisma.$transaction(async (tx) => {
      if (lots) {
        await tx.tireLot.deleteMany({ where: { partId: Number(id) } });
        data.tireLots = { create: lots };
      }
      await tx.part.update({ where: { id: Number(id) }, data });
    });

    res.json({ message: "แก้ไขอะไหล่เรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};

exports.updatePartStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    // ยางส่ง lots มาได้หลายล็อตในครั้งเดียว ส่วนอะไหล่ทั่วไปส่ง quantity เดี่ยว
    const { quantity, dotCode, lots: rawLots } = req.body;
    const partId = Number(id);

    const lots =
      normalizeLots(rawLots) || normalizeLots([{ dotCode, quantity }]);
    // อะไหล่ทั่วไปไม่มี DOT จึงไม่เหลือล็อตหลังกรอง ให้ใช้ quantity ตรงๆ
    const addQty = lots.length ? sumLotQuantity(lots) : Number(quantity) || 0;

    if (addQty <= 0) {
      createError(400, "จำนวนที่เพิ่มต้องมากกว่า 0");
    }

    // ทั้งชุดอยู่ใน transaction เดียว ถ้าล็อตใดพลาดจะไม่มีอะไรเข้าเลย ไม่ใช่เข้าครึ่งเดียว
    await prisma.$transaction(async (tx) => {
      await tx.part.update({
        where: { id: partId },
        data: { stockQuantity: { increment: addQty } },
      });

      // ยาง: merge เข้าล็อต DOT เดิม หรือสร้างล็อตใหม่ ให้ผลรวมล็อตตรงกับ stockQuantity
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
  } catch (error) {
    next(error);
  }
};

exports.deletePart = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.part.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "ลบอะไหล่เรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};
