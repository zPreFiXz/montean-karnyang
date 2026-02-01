const prisma = require("../config/prisma");

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: "asc" },
    });

    res.json(categories);
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;

    await prisma.category.create({
      data: {
        name,
      },
    });

    res.json({ message: "เพิ่มหมวดหมู่เรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.category.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "ลบหมวดหมู่เรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};
