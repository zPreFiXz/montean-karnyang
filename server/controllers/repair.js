const prisma = require("../config/prisma");
const createError = require("../utils/createError");

// หา/สร้างรุ่นรถตามยี่ห้อ+รุ่น (ใช้ทั้งตอนสร้างและแก้ไขรายการซ่อม)
const findOrCreateVehicleModel = async (tx, brand, model) => {
  const vehicleModel = await tx.vehicleModel.findUnique({
    where: { brand_model: { brand, model } },
  });

  if (vehicleModel) return vehicleModel;

  return tx.vehicleModel.create({ data: { brand, model } });
};

// หา/สร้าง/อัปเดตลูกค้า: จับคู่ด้วยเบอร์โทรก่อน (unique) ถ้าไม่มีเบอร์ค่อยจับคู่ด้วยชื่อ
const resolveCustomer = async (tx, { name, address, phoneNumber }) => {
  if (phoneNumber) {
    let customer = await tx.customer.findUnique({ where: { phoneNumber } });

    if (!customer) {
      return tx.customer.create({
        data: { name: name || null, address: address || null, phoneNumber },
      });
    }

    if (name || address) {
      customer = await tx.customer.update({
        where: { id: customer.id },
        data: { name: name || null, address: address || customer.address },
      });
    }

    return customer;
  }

  if (name) {
    const customer = await tx.customer.findFirst({ where: { name } });
    if (customer) return customer;

    return tx.customer.create({
      data: { name, address: address || null, phoneNumber: null },
    });
  }

  return null;
};

// บันทึกรายการซ่อมย่อยชุดใหม่ พร้อมตัดสต็อกอะไหล่ที่ใช้
const createRepairItemsAndDecrementStock = async (tx, repairId, repairItems) => {
  // snapshot ชื่ออะไหล่/บริการ ณ วันซ่อม เผื่ออะไหล่ถูกลบภายหลัง ประวัติจะยังมีชื่อ
  const partIds = repairItems.map((i) => i.partId).filter(Boolean);
  const serviceIds = repairItems.map((i) => i.serviceId).filter(Boolean);

  const [parts, services] = await Promise.all([
    partIds.length
      ? tx.part.findMany({ where: { id: { in: partIds } }, select: { id: true, name: true } })
      : [],
    serviceIds.length
      ? tx.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, name: true } })
      : [],
  ]);

  const partNameById = new Map(parts.map((p) => [p.id, p.name]));
  const serviceNameById = new Map(services.map((s) => [s.id, s.name]));

  await tx.repairItem.createMany({
    data: repairItems.map((item) => ({
      customName: item.customName || null,
      side: item.side || null,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      repairId,
      partId: item.partId,
      serviceId: item.serviceId,
      partName: item.partId ? partNameById.get(item.partId) || null : null,
      serviceName: item.serviceId ? serviceNameById.get(item.serviceId) || null : null,
    })),
  });

  for (const item of repairItems) {
    if (item.partId) {
      await tx.part.update({
        where: { id: item.partId },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }
  }
};

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
      createError(404, "ไม่พบรายการซ่อม");
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
      mileage,
      totalPrice,
      type,
      repairItems,
    } = req.body;

    // ห่อทั้งหมดใน transaction: ถ้าพังกลางทางจะ rollback ไม่เหลือข้อมูลค้างครึ่ง
    await prisma.$transaction(async (tx) => {
      let vehicle;
      let licensePlate;

      const vehicleModel = await findOrCreateVehicleModel(tx, brand, model);

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

      const customer = await resolveCustomer(tx, { name, address, phoneNumber });

      const repair = await tx.repair.create({
        data: {
          description: description || null,
          mileage: mileage ?? null,
          totalPrice,
          type,
          user: { connect: { id: req.user.id } },
          vehicle: { connect: { id: vehicle.id } },
          ...(customer ? { customer: { connect: { id: customer.id } } } : {}),
        },
      });

      if (repairItems?.length) {
        await createRepairItemsAndDecrementStock(tx, repair.id, repairItems);
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
      mileage,
      totalPrice,
      type,
      repairItems,
    } = req.body;

    // ห่อทั้งหมดใน transaction: คืนสต็อก + ลบ/สร้างรายการใหม่ + อัปเดตบิล ต้อง atomic
    await prisma.$transaction(async (tx) => {
      const vehicleModel = await findOrCreateVehicleModel(tx, brand, model);

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

      const customer = await resolveCustomer(tx, { name, address, phoneNumber });

      // คืนสต็อกจากรายการเดิม ก่อนลบทิ้ง
      const existingItems = await tx.repairItem.findMany({
        where: { repairId: Number(id) },
      });

      for (const item of existingItems) {
        if (item.partId) {
          await tx.part.update({
            where: { id: item.partId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
      }

      await tx.repairItem.deleteMany({ where: { repairId: Number(id) } });

      if (repairItems?.length) {
        await createRepairItemsAndDecrementStock(tx, Number(id), repairItems);
      }

      await tx.repair.update({
        where: { id: Number(id) },
        data: {
          description: description || null,
          mileage: mileage ?? null,
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
    // status/paymentMethod ผ่าน zod (updateRepairStatusSchema) มาแล้ว
    const { status, paymentMethod } = req.body;

    const repair = await prisma.repair.findUnique({
      where: { id: Number(id) },
    });

    if (!repair) {
      createError(404, "ไม่พบรายการซ่อม");
    }

    const data = { status };

    if (status === "COMPLETED") {
      data.completedAt = new Date();
    } else if (status === "PAID") {
      data.paidAt = new Date();

      if (repair.status === "IN_PROGRESS" && !repair.completedAt) {
        data.completedAt = new Date();
      }

      if (paymentMethod) {
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
