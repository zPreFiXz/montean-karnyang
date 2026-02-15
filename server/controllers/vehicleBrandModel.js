const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.getVehicleBrandModels = async (req, res, next) => {
  try {
    const vehicleBrandModels = await prisma.vehicleBrandModel.findMany({
      orderBy: { id: "asc" },
    });

    res.json(vehicleBrandModels);
  } catch (error) {
    next(error);
  }
};

exports.createVehicleBrandModel = async (req, res, next) => {
  try {
    const { brand, model } = req.body;

    let vehicleBrandModel;

    vehicleBrandModel = await prisma.vehicleBrandModel.findFirst({
      where: {
        brand,
        model,
      },
    });

    if (vehicleBrandModel) {
      createError(400, "ยี่ห้อและรุ่นรถนี้มีอยู่ในระบบแล้ว");
    }

    vehicleBrandModel = await prisma.vehicleBrandModel.create({
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

exports.updateVehicleBrandModel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { brand, model } = req.body;

    let vehicleBrandModel;

    vehicleBrandModel = await prisma.vehicleBrandModel.findFirst({
      where: {
        brand,
        model,
        id: { not: Number(id) },
      },
    });

    if (vehicleBrandModel) {
      createError(400, "ยี่ห้อและรุ่นรถนี้มีอยู่ในระบบแล้ว");
    }

    vehicleBrandModel = await prisma.vehicleBrandModel.update({
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

exports.deleteVehicleBrandModel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vehicleBrandModel = await prisma.vehicle.findFirst({
      where: { vehicleBrandModelId: Number(id) },
    });

    if (vehicleBrandModel) {
      createError(
        400,
        "ไม่สามารถลบยี่ห้อและรุ่นรถนี้ได้ เนื่องจากมีรถที่ใช้งานอยู่",
      );
    }

    await prisma.vehicleBrandModel.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "ลบยี่ห้อและรุ่นรถเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};
