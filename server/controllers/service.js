const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.getServices = async (req, res, next) => {
  try {
    const services = await prisma.service.findMany();

    res.json(services);
  } catch (error) {
    next(error);
  }
};

exports.createService = async (req, res, next) => {
  try {
    const { name, price, categoryId } = req.body;

    const service = await prisma.service.findUnique({
      where: { name },
    });

    if (service) {
      createError(400, "บริการนี้มีอยู่ในระบบแล้ว");
    }

    await prisma.service.create({
      data: {
        name,
        price,
        categoryId,
      },
    });

    res.json({ message: "เพิ่มบริการเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { name, price, categoryId } = req.body;

    const service = await prisma.service.findUnique({
      where: { name },
    });

    if (service && service.id !== Number(id)) {
      createError(400, "บริการนี้มีอยู่ในระบบแล้ว");
    }

    await prisma.service.update({
      where: { id: Number(id) },
      data: {
        name,
        price,
        categoryId,
      },
    });

    res.json({ message: "แก้ไขบริการเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};

exports.deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.service.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "ลบบริการเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};
