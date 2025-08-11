const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.getPartById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const part = await prisma.part.findFirst({
      where: { id: Number(id) },
    });

    res.json(part);
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
      typeSpecificData,
      compatibleVehicles,
      image,
      categoryId,
    } = req.body;

    if (categoryId === undefined) {
      createError(400, "กรุณาเลือกหมวดหมู่");
    }

    const part = await prisma.part.findUnique({
      where: { partNumber },
    });

    if (part) {
      createError(400, "รหัสอะไหล่นี้ถูกใช้งานแล้ว");
    }

    await prisma.part.create({
      data: {
        partNumber,
        brand,
        name,
        costPrice,
        sellingPrice,
        unit,
        stockQuantity,
        minStockLevel,
        typeSpecificData,
        compatibleVehicles,
        publicId: image?.publicId,
        secureUrl: image?.secureUrl,
        categoryId,
      },
    });

    res.json({ message: "Part created successfully" });
  } catch (error) {
    next(error);
  }
};

exports.updatePart = async (req, res, next) => {
  try {
    const { id } = req.params;

    res.json({ message: "Part updated successfully" });
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

    res.json({ message: "ลบอะไหล่สำเร็จ" });
  } catch (error) {
    next(error);
  }
};
