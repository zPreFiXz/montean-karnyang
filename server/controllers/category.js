const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.listCategories = async (req, res, next) => {
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

    const category = await prisma.category.findUnique({
      where: { name },
    });

    if (category) {
      createError(400, "หมวดหมู่นี้มีอยู่ในระบบแล้ว");
    }

    await prisma.category.create({
      data: {
        name: name,
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
