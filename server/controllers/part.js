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
        .filter((lot) => lot.dotCode)
    : null;

const sumLotQuantity = (lots) => lots.reduce((total, lot) => total + lot.quantity, 0);

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
        brand,
        name,
        costPrice,
        sellingPrice,
        unit,
        stockQuantity: lots ? sumLotQuantity(lots) : stockQuantity,
        minStockLevel,
        attributes,
        compatibleVehicles,
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
      brand,
      name,
      costPrice,
      sellingPrice,
      unit,
      stockQuantity: lots ? sumLotQuantity(lots) : stockQuantity,
      minStockLevel,
      attributes,
      compatibleVehicles,
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
    const { quantity, dotCode } = req.body; // จำนวนที่เพิ่มเข้าสต็อก + DOT (เฉพาะยาง)
    const partId = Number(id);
    const addQty = Number(quantity);
    const dot = String(dotCode || "").trim();

    await prisma.$transaction(async (tx) => {
      await tx.part.update({
        where: { id: partId },
        data: { stockQuantity: { increment: addQty } },
      });

      // ยาง: merge เข้าล็อต DOT เดิม หรือสร้างล็อตใหม่ ให้ผลรวมล็อตตรงกับ stockQuantity
      if (dot) {
        const existingLot = await tx.tireLot.findFirst({
          where: { partId, dotCode: dot },
        });
        if (existingLot) {
          await tx.tireLot.update({
            where: { id: existingLot.id },
            data: { quantity: existingLot.quantity + addQty },
          });
        } else {
          await tx.tireLot.create({
            data: { partId, dotCode: dot, quantity: addQty },
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
