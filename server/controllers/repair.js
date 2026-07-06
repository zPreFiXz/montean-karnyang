const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.listRepairs = async (req, res, next) => {
  try {
    const repairs = await prisma.repair.findMany({
      include: {
        vehicle: {
          include: {
            licensePlate: {
              select: {
                plateNumber: true,
                province: true,
              },
            },
            vehicleModel: {
              select: {
                brand: true,
                model: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(repairs);
  } catch (error) {
    next(error);
  }
};

exports.getRepair = async (req, res, next) => {
  try {
    const { id } = req.params;

    const repair = await prisma.repair.findUnique({
      where: { id: Number(id) },
      include: {
        vehicle: {
          include: {
            licensePlate: {
              select: {
                plateNumber: true,
                province: true,
              },
            },
            vehicleModel: {
              select: {
                brand: true,
                model: true,
              },
            },
          },
        },
        customer: true,
        user: {
          select: {
            name: true,
          },
        },
        repairItems: {
          include: {
            part: {
              include: {
                category: true,
              },
            },
            service: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!repair) {
      return createError(404, "ไม่พบรายการซ่อม");
    }

    res.json(repair);
  } catch (error) {
    next(error);
  }
};

exports.createRepair = async (req, res, next) => {
  try {
    const {
      name,
      address,
      phoneNumber,
      brand,
      model,
      plate,
      province,
      description,
      totalPrice,
      type,
      repairItems,
    } = req.body;

    // ห่อทั้งหมดใน transaction: ถ้าพังกลางทางจะ rollback ไม่เหลือข้อมูลค้างครึ่ง
    await prisma.$transaction(async (tx) => {
      let vehicle;
      let customer;
      let licensePlate;

      let vehicleModel = await tx.vehicleModel.findUnique({
        where: { brand_model: { brand, model } },
      });

      if (!vehicleModel) {
        vehicleModel = await tx.vehicleModel.create({
          data: { brand, model },
        });
      }

      if (plate && province) {
        licensePlate = await tx.licensePlate.findUnique({
          where: { plateNumber_province: { plateNumber: plate, province } },
        });

        if (licensePlate) {
          vehicle = await tx.vehicle.findFirst({
            where: {
              licensePlateId: licensePlate.id,
              vehicleModelId: vehicleModel.id,
            },
          });

          if (!vehicle) {
            vehicle = await tx.vehicle.create({
              data: {
                vehicleModelId: vehicleModel.id,
                licensePlateId: licensePlate.id,
              },
            });
          }
        } else {
          licensePlate = await tx.licensePlate.create({
            data: { plateNumber: plate, province },
          });

          vehicle = await tx.vehicle.create({
            data: {
              vehicleModelId: vehicleModel.id,
              licensePlateId: licensePlate.id,
            },
          });
        }
      } else {
        vehicle = await tx.vehicle.findFirst({
          where: { vehicleModelId: vehicleModel.id, licensePlateId: null },
        });

        if (!vehicle) {
          vehicle = await tx.vehicle.create({
            data: { vehicleModelId: vehicleModel.id, licensePlateId: null },
          });
        }
      }

      if (phoneNumber) {
        customer = await tx.customer.findUnique({
          where: { phoneNumber },
        });

        if (!customer) {
          customer = await tx.customer.create({
            data: {
              name: name || null,
              address: address || null,
              phoneNumber,
            },
          });
        } else if (name || address) {
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: {
              name: name || null,
              address: address || customer.address,
            },
          });
        }
      } else if (name && !phoneNumber) {
        customer = await tx.customer.findFirst({
          where: { name },
        });

        if (!customer) {
          customer = await tx.customer.create({
            data: { name, address: address || null, phoneNumber: null },
          });
        }
      }

      const repair = await tx.repair.create({
        data: {
          description: description || null,
          totalPrice,
          type,
          user: { connect: { id: req.user.id } },
          vehicle: { connect: { id: vehicle.id } },
          ...(customer ? { customer: { connect: { id: customer.id } } } : {}),
        },
      });

      if (repairItems) {
        await tx.repairItem.createMany({
          data: repairItems.map((item) => ({
            customName: item.customName || null,
            side: item.side || null,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            repairId: repair.id,
            partId: item.partId,
            serviceId: item.serviceId,
          })),
        });

        for (const item of repairItems) {
          if (item.partId) {
            await tx.part.update({
              where: { id: item.partId },
              data: { quantity: { decrement: item.quantity } },
            });
          }
        }
      }
    });

    res.json({ message: "สร้างรายการซ่อมเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};

exports.updateRepair = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      address,
      phoneNumber,
      brand,
      model,
      plate,
      province,
      description,
      totalPrice,
      type,
      repairItems,
    } = req.body;

    // ห่อทั้งหมดใน transaction: คืนสต็อก + ลบ/สร้างรายการใหม่ + อัปเดตบิล ต้อง atomic
    await prisma.$transaction(async (tx) => {
      let vehicleModel = await tx.vehicleModel.findUnique({
        where: { brand_model: { brand, model } },
      });

      if (!vehicleModel) {
        vehicleModel = await tx.vehicleModel.create({
          data: { brand, model },
        });
      }

      const currentRepair = await tx.repair.findUnique({
        where: { id: Number(id) },
        select: { vehicleId: true },
      });

      let vehicle;
      if (plate && province) {
        let licensePlate = await tx.licensePlate.findUnique({
          where: { plateNumber_province: { plateNumber: plate, province } },
        });
        if (!licensePlate) {
          licensePlate = await tx.licensePlate.create({
            data: { plateNumber: plate, province },
          });
        }

        vehicle = await tx.vehicle.upsert({
          where: { id: currentRepair.vehicleId },
          update: {
            vehicleModelId: vehicleModel.id,
            licensePlateId: licensePlate.id,
          },
          create: {
            vehicleModelId: vehicleModel.id,
            licensePlateId: licensePlate.id,
          },
        });
      } else {
        const existingVehicle = await tx.vehicle.findFirst({
          where: { vehicleModelId: vehicleModel.id, licensePlateId: null },
        });

        if (existingVehicle && existingVehicle.id !== currentRepair.vehicleId) {
          vehicle = existingVehicle;
        } else {
          vehicle = await tx.vehicle.update({
            where: { id: currentRepair.vehicleId },
            data: { vehicleModelId: vehicleModel.id, licensePlateId: null },
          });
        }
      }

      let customer = null;
      if (phoneNumber) {
        customer = await tx.customer.findUnique({
          where: { phoneNumber },
        });
        if (!customer) {
          customer = await tx.customer.create({
            data: {
              name: name || null,
              address: address || null,
              phoneNumber,
            },
          });
        } else if (name || address) {
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: {
              name: name || null,
              address: address || customer.address,
            },
          });
        }
      } else if (name && !phoneNumber) {
        customer = await tx.customer.findFirst({ where: { name } });
        if (!customer) {
          customer = await tx.customer.create({
            data: { name, address: address || null, phoneNumber: null },
          });
        }
      }

      // คืนสต็อกจากรายการเดิม ก่อนลบทิ้ง
      const existingItems = await tx.repairItem.findMany({
        where: { repairId: Number(id) },
      });

      for (const item of existingItems) {
        if (item.partId) {
          await tx.part.update({
            where: { id: item.partId },
            data: { quantity: { increment: item.quantity } },
          });
        }
      }

      await tx.repairItem.deleteMany({ where: { repairId: Number(id) } });

      if (Array.isArray(repairItems) && repairItems.length) {
        await tx.repairItem.createMany({
          data: repairItems.map((item) => ({
            customName: item.customName || null,
            side: item.side || null,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            repairId: Number(id),
            partId: item.partId,
            serviceId: item.serviceId,
          })),
        });

        for (const item of repairItems) {
          if (item.partId) {
            await tx.part.update({
              where: { id: item.partId },
              data: { quantity: { decrement: item.quantity } },
            });
          }
        }
      }

      await tx.repair.update({
        where: { id: Number(id) },
        data: {
          description: description || null,
          totalPrice,
          type,
          vehicle: { connect: { id: vehicle.id } },
          ...(customer
            ? { customer: { connect: { id: customer.id } } }
            : { customer: { disconnect: true } }),
        },
      });
    });

    res.json({ message: "แก้ไขรายการซ่อมเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};

exports.updateRepairStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nextStatus, paymentMethod } = req.body;

    const repair = await prisma.repair.findUnique({
      where: { id: Number(id) },
    });

    if (!repair) {
      return createError(404, "ไม่พบรายการซ่อม");
    }

    const data = {};

    if (nextStatus === "COMPLETED") {
      data.status = "COMPLETED";
      data.completedAt = new Date();
    } else if (nextStatus === "PAID") {
      data.status = "PAID";
      data.paidAt = new Date();

      if (repair.status === "IN_PROGRESS" && !repair.completedAt) {
        data.completedAt = new Date();
      }

      const validPaymentMethods = ["CASH", "CREDIT_CARD", "QR_CODE"];
      if (paymentMethod && validPaymentMethods.includes(paymentMethod)) {
        data.paymentMethod = paymentMethod;
      }
    }

    await prisma.repair.update({
      where: { id: Number(id) },
      data,
    });

    res.json({
      message: "อัปเดตสถานะการซ่อมเรียบร้อยแล้ว",
    });
  } catch (error) {
    next(error);
  }
};
