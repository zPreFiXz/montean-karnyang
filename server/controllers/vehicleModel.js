const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.listVehicleModels = async (req, res, next) => {
  try {
    const vehicleModels = await prisma.vehicleModel.findMany({
      orderBy: { id: "asc" },
    });

    res.json(vehicleModels);
  } catch (error) {
    next(error);
  }
};

exports.createVehicleModel = async (req, res, next) => {
  try {
    const { brand, model } = req.body;

    let vehicleModel;

    vehicleModel = await prisma.vehicleModel.findFirst({
      where: {
        brand,
        model,
      },
    });

    if (vehicleModel) {
      createError(400, "ยี่ห้อและรุ่นรถนี้มีอยู่ในระบบแล้ว");
    }

    vehicleModel = await prisma.vehicleModel.create({
      data: {
        brand,
        model,
      },
    });

    res.json({ message: "เพิ่มยี่ห้อและรุ่นรถเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};

exports.updateVehicleModel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { brand, model } = req.body;

    let vehicleModel;

    vehicleModel = await prisma.vehicleModel.findFirst({
      where: {
        brand,
        model,
        id: { not: Number(id) },
      },
    });

    if (vehicleModel) {
      createError(400, "ยี่ห้อและรุ่นรถนี้มีอยู่ในระบบแล้ว");
    }

    vehicleModel = await prisma.vehicleModel.update({
      where: { id: Number(id) },
      data: {
        brand,
        model,
      },
    });

    res.json({ message: "แก้ไขยี่ห้อและรุ่นรถเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};

exports.deleteVehicleModel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vehicleInUse = await prisma.vehicle.findFirst({
      where: { vehicleModelId: Number(id) },
    });

    if (vehicleInUse) {
      createError(
        400,
        "ไม่สามารถลบยี่ห้อและรุ่นรถนี้ได้ เนื่องจากมีรถที่ใช้งานอยู่",
      );
    }

    await prisma.vehicleModel.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "ลบยี่ห้อและรุ่นรถเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};
