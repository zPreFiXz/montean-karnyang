const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.listCategories = async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  res.json(categories);
};

exports.createCategory = async (req, res) => {
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
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;

  // ฐานข้อมูลปฏิเสธอยู่แล้ว แต่ข้อความกลางเกินไป จึงเช็กเองเพื่อบอกเหตุผล
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
};
