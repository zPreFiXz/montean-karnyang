const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.listVehicles = async (req, res, next) => {
  try {
    const { search } = req.query;

    let filter = {};

    if (search) {
      filter = {
        OR: [
          {
            vehicleModel: {
              OR: [
                { brand: { contains: search } },
                { model: { contains: search } },
              ],
            },
          },
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
        vehicleModel: true,
      },
    });

    res.json(vehicles);
  } catch (error) {
    next(error);
  }
};

exports.getVehicle = async (req, res, next) => {
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
        vehicleModel: true,
        repairs: {
          select: {
            id: true,
            createdAt: true,
            repairItems: true,
          },
        },
      },
    });

    if (!vehicle) {
      createError(404, "ไม่พบข้อมูลรถ");
    }

    res.json(vehicle);
  } catch (error) {
    next(error);
  }
};
