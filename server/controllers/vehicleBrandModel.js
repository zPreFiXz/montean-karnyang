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
      createError(400, "ยี่ห้อ-รุ่นรถนี้มีอยู่ในระบบแล้ว");
    }

    vehicleBrandModel = await prisma.vehicleBrandModel.create({
      data: {
        brand,
        model,
      },
    });

    res.json({ message: "สร้างยี่ห้อ-รุ่นรถสำเร็จ" });
  } catch (error) {
    next(error);
  }
};

exports.updateVehicleBrandModel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { brand, model } = req.body;

    let vehicleBrandModel;

    // ตรวจสอบว่ามียี่ห้อ-รุ่นรถอยู่หรือไม่
    vehicleBrandModel = await prisma.vehicleBrandModel.findUnique({
      where: { id: parseInt(id) },
    });

    if (!vehicleBrandModel) {
      createError(404, "ไม่พบยี่ห้อ-รุ่นรถที่ต้องการแก้ไข");
    }

    // ตรวจสอบว่ามียี่ห้อ-รุ่นนี้อยู่แล้วหรือไม่ (ยกเว้นรายการที่กำลังแก้ไข)
    const duplicateVehicleBrandModel = await prisma.vehicleBrandModel.findFirst(
      {
        where: {
          brand,
          model,
          id: { not: parseInt(id) },
        },
      }
    );

    if (duplicateVehicleBrandModel) {
      createError(400, "ยี่ห้อ-รุ่นรถนี้มีอยู่ในระบบแล้ว");
    }

    vehicleBrandModel = await prisma.vehicleBrandModel.update({
      where: { id: parseInt(id) },
      data: {
        brand,
        model,
      },
    });

    res.json({ message: "แก้ไขยี่ห้อ-รุ่นรถสำเร็จ" });
  } catch (error) {
    next(error);
  }
};

exports.deleteVehicleBrandModel = async (req, res, next) => {
  try {
    const { id } = req.params;

    let vehicleBrandModel;

    // ตรวจสอบว่ามียี่ห้อ-รุ่นรถอยู่หรือไม่
    vehicleBrandModel = await prisma.vehicleBrandModel.findUnique({
      where: { id: parseInt(id) },
    });

    if (!vehicleBrandModel) {
      createError(404, "ไม่พบยี่ห้อ-รุ่นรถที่ต้องการลบ");
    }

    // ตรวจสอบว่ามีการใช้งานยี่ห้อ-รุ่นนี้หรือไม่
    const vehiclesUsingThisBrandModel = await prisma.vehicle.findFirst({
      where: { brandModelId: parseInt(id) },
    });

    if (vehiclesUsingThisBrandModel) {
      createError(
        400,
        "ไม่สามารถลบยี่ห้อ-รุ่นรถนี้ได้ เนื่องจากมีรถยนต์ที่ใช้ยี่ห้อ-รุ่นนี้อยู่"
      );
    }

    await prisma.vehicleBrandModel.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "ลบยี่ห้อ-รุ่นรถสำเร็จ" });
  } catch (error) {
    next(error);
  }
};
