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
      createError(400, "บริการนี้มีอยู่แล้ว");
    }

    await prisma.service.create({
      data: {
        name,
        price,
        categoryId,
      },
    });

    res.json({ message: "Service created successfully" });
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

    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    next(error);
  }
};
