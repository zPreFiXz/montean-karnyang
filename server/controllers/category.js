const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.listCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
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

    // อะไหล่กับบริการต้องมีหมวดหมู่เสมอ ลบหมวดหมู่ทิ้งของที่อยู่ในนั้นจะไม่มีที่อยู่
    // (ฐานข้อมูลปฏิเสธให้อยู่แล้ว แต่ข้อความที่ได้กลางเกินไป จึงเช็กเองเพื่อบอกเหตุผลจริง)
    const [partInCategory, serviceInCategory] = await Promise.all([
      prisma.part.findFirst({ where: { categoryId: Number(id) } }),
      prisma.service.findFirst({ where: { categoryId: Number(id) } }),
    ]);

    if (partInCategory || serviceInCategory) {
      createError(400, "ลบไม่ได้ เพราะมีอะไหล่หรือบริการอยู่ในหมวดหมู่นี้");
    }

    await prisma.category.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "ลบหมวดหมู่เรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};
