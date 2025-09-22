const { PrismaClient } = require("@prisma/client");
const createError = require("../utils/createError");
const prisma = new PrismaClient();

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

    // ตรวจสอบว่ามียี่ห้อ-รุ่นนี้อยู่แล้วหรือไม่
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

    res.json({ message: "Create vehicle brand model successfully" });
  } catch (error) {
    next(error);
  }
};

exports.updateVehicleBrandModel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { brand, model } = req.body;

    let vehicleBrandModel;

    // ตรวจสอบว่ามียี่ห้อ-รุ่นนี้อยู่แล้วหรือไม่ (ยกเว้นรายการที่กำลังแก้ไข)
    vehicleBrandModel = await prisma.vehicleBrandModel.findFirst({
      where: {
        brand,
        model,
        id: { not: parseInt(id) },
      },
    });

    if (vehicleBrandModel) {
      createError(400, "ยี่ห้อและรุ่นรถนี้มีอยู่ในระบบแล้ว");
    }

    vehicleBrandModel = await prisma.vehicleBrandModel.update({
      where: { id: parseInt(id) },
      data: {
        brand,
        model,
      },
    });

    res.json({ message: "Update vehicle brand model successfully" });
  } catch (error) {
    next(error);
  }
};

exports.deleteVehicleBrandModel = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ตรวจสอบว่ามีการใช้งานยี่ห้อ-รุ่นนี้หรือไม่
    const vehicleBrandModel = await prisma.vehicle.findFirst({
      where: { vehicleBrandModelId: parseInt(id) },
    });

    if (vehicleBrandModel) {
      createError(
        400,
        "ไม่สามารถลบยี่ห้อและรุ่นรถนี้ได้ เนื่องจากมีรถที่ใช้งานอยู่"
      );
    }

    await prisma.vehicleBrandModel.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Delete vehicle brand model successfully" });
  } catch (error) {
    next(error);
  }
};
