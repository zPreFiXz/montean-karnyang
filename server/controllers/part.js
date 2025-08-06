const prisma = require("../config/prisma");

exports.getParts = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    let whereCondition = {};

    if (category && search) {
      whereCondition = {
        AND: [
          {
            category: {
              name: category,
            },
          },
          {
            OR: [
              { partNumber: { contains: search } },
              { name: { contains: search } },
              { brand: { contains: search } },
            ],
          },
        ],
      };
    } else if (category) {
      whereCondition.category = {
        name: category,
      };
    } else if (search) {
      whereCondition.OR = [
        { name: { contains: search } },
        { brand: { contains: search } },
        { partNumber: { contains: search } },
      ];
    }

    const parts = await prisma.part.findMany({
      where: whereCondition,
      include: {
        category: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    res.json(parts);
  } catch (error) {
    next(error);
  }
};

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

    await prisma.part.create({
      data: {
        partNumber,
        brand,
        name,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        unit,
        stockQuantity: Number(stockQuantity),
        minStockLevel: Number(minStockLevel),
        typeSpecificData,
        compatibleVehicles,
        publicId: image?.publicId,
        secureUrl: image?.secureUrl,
        categoryId: Number(categoryId),
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
