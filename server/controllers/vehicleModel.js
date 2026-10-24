const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.listVehicleModels = async (req, res) => {
  const vehicleModels = await prisma.vehicleModel.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  res.json(vehicleModels);
};

// ส่งมาทั้งชุดเสมอ เพราะเลื่อนหนึ่งตัวลำดับของตัวอื่นก็เปลี่ยนตาม
exports.reorderVehicleModels = async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    createError(400, "ไม่พบลำดับที่ต้องการบันทึก");
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.vehicleModel.update({
        where: { id: Number(id) },
        data: { sortOrder: index + 1 },
      }),
    ),
  );

  res.json({ message: "บันทึกลำดับเรียบร้อยแล้ว" });
};

exports.createVehicleModel = async (req, res) => {
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

  const last = await prisma.vehicleModel.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  vehicleModel = await prisma.vehicleModel.create({
    data: {
      brand,
      model,
      sortOrder: (last?.sortOrder || 0) + 1,
    },
  });

  res.json({ message: "เพิ่มยี่ห้อและรุ่นรถเรียบร้อยแล้ว" });
};

exports.updateVehicleModel = async (req, res) => {
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
};

exports.deleteVehicleModel = async (req, res) => {
  const { id } = req.params;

  const vehicleInUse = await prisma.vehicle.findFirst({
    where: { vehicleModelId: Number(id) },
  });

  if (vehicleInUse) {
    createError(400, "ลบไม่ได้ เพราะมีรถที่ใช้ยี่ห้อและรุ่นรถนี้อยู่");
  }

  await prisma.vehicleModel.delete({
    where: { id: Number(id) },
  });

  res.json({ message: "ลบยี่ห้อและรุ่นรถเรียบร้อยแล้ว" });
};
