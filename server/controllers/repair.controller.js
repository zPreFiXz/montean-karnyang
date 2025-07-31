const prisma = require("../config/prisma");

exports.getRepairs = async (req, res, next) => {
  try {
    const repairs = await prisma.repair.findMany();

    res.json(repairs);
  } catch (error) {
    next(error);
  }
};

exports.getRepairById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const repair = await prisma.repair.findFirst({
      where: { id: Number(id) },
    });

    res.json(repair);
  } catch (error) {
    next(error);
  }
};

exports.createRepair = async (req, res, next) => {
  try {
    const { brand, model, plateNumber, province, description, totalPrice } =
      req.body;

    const licensePlate = await prisma.licensePlate.findUnique({
      where: {
        plateNumber_province: {
          plateNumber,
          province,
        },
      },
    });

    let vehicle;

    if (licensePlate) {
      vehicle = await prisma.vehicle.findUnique({
        where: { id: licensePlate.vehicleId },
      });

      const isSameVehicle = vehicle.brand === brand && vehicle.model === model;

      if (!isSameVehicle) {
        vehicle = await prisma.vehicle.create({
          data: {
            brand,
            model,
          },
        });

        await prisma.licensePlate.update({
          where: { id: licensePlate.id },
          data: { vehicleId: vehicle.id },
        });
      }
    } else {
      vehicle = await prisma.vehicle.create({
        data: {
          brand,
          model,
        },
      });

      await prisma.licensePlate.create({
        data: {
          plateNumber,
          province,
          vehicleId: vehicle.id,
        },
      });
    }

    await prisma.repair.create({
      data: {
        description,
        totalPrice,
        vehicleId: vehicle.id,
        userId: req.user.id,
      },
    });

    res.json({ message: "Repair created successfully" });
  } catch (error) {
    next(error);
  }
};

exports.updateRepair = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, totalPrice } = req.body;

    await prisma.repair.update({
      where: { id: Number(id) },
      data: { description, totalPrice },
    });

    res.json({ message: "Repair updated successfully" });
  } catch (error) {
    next(error);
  }
};

exports.deleteRepair = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.repair.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Repair deleted successfully" });
  } catch (error) {
    next(error);
  }
};
