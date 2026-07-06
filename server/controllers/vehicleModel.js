const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.getVehicleBrands = async (req, res, next) => {
  try {
    const vehicleBrands = await prisma.vehicleBrand.findMany({
      orderBy: { id: "asc" },
    });

    res.json(vehicleBrands);
  } catch (error) {
    next(error);
  }
};

exports.createVehicleBrand = async (req, res, next) => {
  try {
    const { brand, model } = req.body;

    let vehicleBrand;

    vehicleBrand = await prisma.vehicleBrand.findFirst({
      where: {
        brand,
        model,
      },
    });

    if (vehicleBrand) {
      createError(400, "ยี่ห้อและรุ่นรถนี้มีอยู่ในระบบแล้ว");
    }

    vehicleBrand = await prisma.vehicleBrand.create({
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

exports.updateVehicleBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { brand, model } = req.body;

    let vehicleBrand;

    vehicleBrand = await prisma.vehicleBrand.findFirst({
      where: {
        brand,
        model,
        id: { not: Number(id) },
      },
    });

    if (vehicleBrand) {
      createError(400, "ยี่ห้อและรุ่นรถนี้มีอยู่ในระบบแล้ว");
    }

    vehicleBrand = await prisma.vehicleBrand.update({
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

exports.deleteVehicleBrand = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vehicleBrand = await prisma.vehicle.findFirst({
      where: { vehicleBrandId: Number(id) },
    });

    if (vehicleBrand) {
      createError(
        400,
        "ไม่สามารถลบยี่ห้อและรุ่นรถนี้ได้ เนื่องจากมีรถที่ใช้งานอยู่",
      );
    }

    await prisma.vehicleBrand.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "ลบยี่ห้อและรุ่นรถเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};
