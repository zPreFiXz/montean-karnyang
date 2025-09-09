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

    // ตรวจสอบว่ารหัสอะไหล่ซ้ำกับรหัสอื่นๆ หรือไม่ (ยกเว้นอะไหล่ปัจจุบัน)
    const part = await prisma.part.findUnique({
      where: { partNumber },
    });

    if (part && part.id !== Number(id)) {
      createError(400, "รหัสอะไหล่นี้ถูกใช้งานแล้ว");
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
        stockQuantity,
        minStockLevel,
        typeSpecificData,
        compatibleVehicles,
        publicId: image?.publicId,
        secureUrl: image?.secureUrl,
        categoryId,
      },
    });

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

    res.json({ message: "Part deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.addStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    await prisma.part.update({
      where: { id: Number(id) },
      data: {
        stockQuantity: {
          increment: Number(quantity),
        },
      },
    });

    res.json({ message: "Stock added successfully" });
  } catch (error) {
    next(error);
  }
};
