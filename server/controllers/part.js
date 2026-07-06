const prisma = require("../config/prisma");
const createError = require("../utils/createError");

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
      quantity,
      minStockLevel,
      typeSpecificData,
      compatibleVehicles,
      image,
      categoryId,
    } = req.body;

    const part = await prisma.part.findUnique({
      where: { partNumber },
    });

    if (part) {
      createError(400, "รหัสอะไหล่นี้มีอยู่ในระบบแล้ว");
    }

    await prisma.part.create({
      data: {
        partNumber,
        brand,
        name,
        costPrice,
        sellingPrice,
        unit,
        quantity,
        minStockLevel,
        typeSpecificData,
        compatibleVehicles,
        public_id: image?.public_id,
        secure_url: image?.secure_url,
        categoryId,
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
      quantity,
      minStockLevel,
      typeSpecificData,
      compatibleVehicles,
      image,
      categoryId,
    } = req.body;

    const part = await prisma.part.findUnique({
      where: { partNumber },
    });

    if (part && part.id !== Number(id)) {
      createError(400, "รหัสอะไหล่นี้มีอยู่ในระบบแล้ว");
    }

    await prisma.part.update({
      where: { id: Number(id) },
      data: {
        partNumber,
        brand,
        name,
        costPrice,
        sellingPrice,
        unit,
        quantity,
        minStockLevel,
        typeSpecificData,
        compatibleVehicles,
        public_id: image?.public_id,
        secure_url: image?.secure_url,
        categoryId,
      },
    });

    res.json({ message: "แก้ไขอะไหล่เรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};

exports.updatePartStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    await prisma.part.update({
      where: { id: Number(id) },
      data: {
        quantity: {
          increment: Number(quantity),
        },
      },
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
