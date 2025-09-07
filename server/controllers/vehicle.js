const prisma = require("../config/prisma");

exports.getVehicles = async (req, res, next) => {
  try {
    const { search } = req.query;

    let filter = {};

    if (search) {
      filter = {
        OR: [
          // ค้นหาใน brand และ model
          { brand: { contains: search } },
          { model: { contains: search } },
          // ค้นหาใน vehicleBrandModel
          {
            vehicleBrandModel: {
              OR: [
                { brand: { contains: search } },
                { model: { contains: search } },
              ],
            },
          },
          // ค้นหาในทะเบียนรถ
          {
            licensePlate: {
              OR: [
                { plateNumber: { contains: search } },
                { province: { contains: search } },
              ],
            },
          },
        ],
      };
    }

    const vehicles = await prisma.vehicle.findMany({
      where: filter,
      include: {
        licensePlate: true,
        vehicleBrandModel: true,
      },
    });

    res.json(vehicles);
  } catch (error) {
    next(error);
  }
};

exports.getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findFirst({
      where: { id: Number(id) },
      include: {
        licensePlate: {
          select: {
            plateNumber: true,
            province: true,
          },
        },
        vehicleBrandModel: true,
        repairs: {
          select: {
            id: true,
            createdAt: true,
            repairItems: true,
          },
        },
      },
    });

    res.json(vehicle);
  } catch (error) {
    next(error);
  }
};
