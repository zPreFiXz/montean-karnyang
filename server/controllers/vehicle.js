const prisma = require("../config/prisma");

exports.getVehicles = async (req, res, next) => {
  try {
    const { search } = req.query;

    let filter = {};

    if (search) {
      filter = {
        OR: [
          {
            vehicleBrand: {
              OR: [
                { brand: { contains: search } },
                { model: { contains: search } },
              ],
            },
          },
          {
            licensePlate: {
              OR: [
                { plate: { contains: search } },
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
        vehicleBrand: true,
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
            plate: true,
            province: true,
          },
        },
        vehicleBrand: true,
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
