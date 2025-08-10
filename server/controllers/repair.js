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
      include: {
        customer: true,
        vehicle: {
          include: {
            licensePlate: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nickname: true,
          },
        },
        repairItems: {
          include: {
            part: true,
            service: true,
          },
        },
      },
    });

    res.json(repair);
  } catch (error) {
    next(error);
  }
};

exports.createRepair = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      address,
      phoneNumber,
      brand,
      model,
      plateNumber,
      province,
      description,
      totalPrice,
      repairItems,
    } = req.body;

    console.log(req.body);

    let vehicle;
    let customer;
    let licensePlate;

    licensePlate = await prisma.licensePlate.findUnique({
      where: {
        plateNumber_province: {
          plateNumber,
          province,
        },
      },
    });

    if (licensePlate) {
      vehicle = await prisma.vehicle.findFirst({
        where: { licensePlateId: licensePlate.id },
      });

      if (vehicle) {
        const isSameVehicle =
          vehicle.brand === brand && vehicle.model === model;

        if (!isSameVehicle) {
          await prisma.vehicle.update({
            where: { id: vehicle.id },
            data: {
              licensePlateId: null,
            },
          });

          vehicle = await prisma.vehicle.create({
            data: {
              brand,
              model,
              licensePlateId: licensePlate.id,
            },
          });
        }
      } else {
        vehicle = await prisma.vehicle.create({
          data: {
            brand,
            model,
            licensePlateId: licensePlate.id,
          },
        });
      }
    } else {
      licensePlate = await prisma.licensePlate.create({
        data: {
          plateNumber,
          province,
        },
      });
      vehicle = await prisma.vehicle.create({
        data: {
          brand,
          model,
          licensePlateId: licensePlate.id,
        },
      });
    }

    if (phoneNumber) {
      customer = await prisma.customer.findUnique({
        where: { phoneNumber: phoneNumber },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            firstName: firstName || null,
            lastName: lastName || null,
            address: address || null,
            phoneNumber: phoneNumber,
          },
        });
      } else if (firstName || lastName || address) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            firstName: firstName || null,
            lastName: lastName || null,
            address: address || customer.address,
          },
        });
      }
    } else if (firstName && !phoneNumber) {
      customer = await prisma.customer.create({
        data: {
          firstName: firstName,
          lastName: lastName || null,
          address: address || null,
          phoneNumber: null,
        },
      });
    }

    const repair = await prisma.repair.create({
      data: {
        description: description || null,
        totalPrice,
        user: { connect: { id: req.user.id } },
        vehicle: { connect: { id: vehicle.id } },
        ...(customer ? { customer: { connect: { id: customer.id } } } : {}),
      },
    });

    if (repairItems && repairItems.length > 0) {
      const repairItemsData = repairItems.map((item) => ({
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        repairId: repair.id,
        partId: item.partId,
        serviceId: item.serviceId,
      }));

      await prisma.repairItem.createMany({
        data: repairItemsData,
      });

      for (const item of repairItems) {
        if (item.partId) {
          await prisma.part.update({
            where: { id: item.partId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }
      }
    }

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
