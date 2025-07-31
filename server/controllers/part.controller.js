const prisma = require("../config/prisma");

exports.getParts = async (req, res, next) => {
  try {
    const parts = await prisma.part.findMany();

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
      name,
      costPrice,
      sellingPrice,
      stockQuantity,
      minStockLevel,
    } = req.body;

    await prisma.part.create({
      data: {
        partNumber,
        name,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        stockQuantity: Number(stockQuantity),
        minStockLevel: Number(minStockLevel),
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

    res.json({ message: "Part deleted successfully" });
  } catch (error) {
    next(error);
  }
};
