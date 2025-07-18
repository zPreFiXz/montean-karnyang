const prisma = require("../config/prisma");

exports.getRepairs = async (req, res, next) => {
  try {
    const repairs = await prisma.Repair.findMany();

    res.json({ result: repairs });
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

exports.getRepairById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const repair = await prisma.Repair.findFirst({
      where: { id: Number(id) },
    });

    res.json({ result: repair });
  } catch (error) {
    next(error);
  }
};

exports.createRepair = async (req, res, next) => {
  try {
    const { brand, model, plate_number, province, description, total_price } =
      req.body;

    const licensePlate = await prisma.LicensePlate.findUnique({
      where: {
        plate_number_province: {
          plate_number,
          province,
        },
      },
    });

    let vehicle;

    if (licensePlate) {
      vehicle = await prisma.Vehicle.findUnique({
        where: { id: licensePlate.vehicle_id },
      });

      const isSameVehicle = vehicle.brand === brand && vehicle.model === model;

      if (!isSameVehicle) {
        vehicle = await prisma.Vehicle.create({
          data: {
            brand,
            model,
          },
        });

        await prisma.LicensePlate.update({
          where: { id: licensePlate.id },
          data: { vehicle_id: vehicle.id },
        });
      }
    } else {
      vehicle = await prisma.Vehicle.create({
        data: {
          brand,
          model,
        },
      });

      await prisma.LicensePlate.create({
        data: {
          plate_number,
          province,
          vehicle_id: vehicle.id,
        },
      });
    }

    await prisma.Repair.create({
      data: {
        description,
        total_price,
        vehicle_id: vehicle.id,
        user_id: req.user.id,
      },
    });

    res.json({ result: vehicle });
  } catch (error) {
    next(error);
  }
};

exports.updateRepair = (req, res, next) => {
  try {
    console.log("Updating vehicle");
    res.json({ message: "Vehicle updated successfully" });
  } catch (error) {
    next(error);
  }
};

exports.deleteRepair = (req, res, next) => {
  try {
    console.log("Deleting vehicle");
    res.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    next(error);
  }
};
