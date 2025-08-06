const prisma = require("../config/prisma");

exports.getService = async (req, res, next) => {
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

    await prisma.service.create({
      data: {
        name,
        price: Number(price),
        categoryId: Number(categoryId),
      },
    });

    res.json({ message: "เพิ่มบริการสำเร็จ" });
  } catch (error) {
    next(error);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    const { id } = req.params;

    res.json({ message: "Service updated successfully" });
  } catch (error) {
    next(error);
  }
};

exports.deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.part.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "ลบบริการสำเร็จ" });
  } catch (error) {
    next(error);
  }
};
