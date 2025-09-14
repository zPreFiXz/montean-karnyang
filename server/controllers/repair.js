const prisma = require("../config/prisma");

exports.getRepairs = async (req, res, next) => {
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
            vehicleBrandModel: {
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

exports.getRepairById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const repair = await prisma.repair.findFirst({
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
            vehicleBrandModel: {
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
            fullName: true,
            nickname: true,
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

    res.json(repair);
  } catch (error) {
    next(error);
  }
};

exports.createRepair = async (req, res, next) => {
  try {
    const {
      fullName,
      address,
      phoneNumber,
      brand,
      model,
      plateNumber,
      province,
      description,
      totalPrice,
      source,
      repairItems,
    } = req.body;

    let vehicle;
    let customer;
    let licensePlate;
    let vehicleBrandModel;

    // ค้นหาหรือสร้าง VehicleBrandModel
    vehicleBrandModel = await prisma.vehicleBrandModel.findUnique({
      where: {
        brand_model: {
          brand,
          model,
        },
      },
    });

    if (!vehicleBrandModel) {
      vehicleBrandModel = await prisma.vehicleBrandModel.create({
        data: {
          brand,
          model,
        },
      });
    }

    // ค้นหาทะเบียนรถในฐานข้อมูล (เฉพาะเมื่อมีข้อมูลทะเบียน)
    if (plateNumber && province) {
      licensePlate = await prisma.licensePlate.findUnique({
        where: {
          plateNumber_province: {
            plateNumber,
            province,
          },
        },
      });

      // ถ้ามีทะเบียนรถในฐานข้อมูล
      if (licensePlate) {
        // ตรวจสอบว่ามีรถคันนี้ที่ใช้ทะเบียนนี้และ vehicleBrandModel ตรงกันหรือไม่
        vehicle = await prisma.vehicle.findFirst({
          where: {
            licensePlateId: licensePlate.id,
            vehicleBrandModelId: vehicleBrandModel.id,
          },
        });

        if (!vehicle) {
          // ถ้าไม่เจอ ให้สร้างรถใหม่ที่ใช้ทะเบียนเดิม
          vehicle = await prisma.vehicle.create({
            data: {
              vehicleBrandModelId: vehicleBrandModel.id,
              licensePlateId: licensePlate.id,
            },
          });
        }
      } else {
        // ถ้าไม่มีทะเบียนรถในฐานข้อมูล สร้างทะเบียนใหม่และรถใหม่
        licensePlate = await prisma.licensePlate.create({
          data: {
            plateNumber,
            province,
          },
        });

        vehicle = await prisma.vehicle.create({
          data: {
            vehicleBrandModelId: vehicleBrandModel.id,
            licensePlateId: licensePlate.id,
          },
        });
      }
    } else {
      // ถ้าไม่มีข้อมูลทะเบียน ให้สร้างรถโดยไม่มีทะเบียน
      vehicle = await prisma.vehicle.create({
        data: {
          vehicleBrandModelId: vehicleBrandModel.id,
          licensePlateId: null,
        },
      });
    }

    // ค้นหาลูกค้าในฐานข้อมูลตามหมายเลขโทรศัพท์
    if (phoneNumber) {
      customer = await prisma.customer.findUnique({
        where: { phoneNumber: phoneNumber },
      });

      // ถ้าไม่พบลูกค้า จะสร้างลูกค้าใหม่
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            fullName: fullName || null,
            address: address || null,
            phoneNumber: phoneNumber,
          },
        });
        // ถ้าพบลูกค้าแล้ว จะอัปเดตข้อมูลลูกค้า
      } else if (fullName || address) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            fullName: fullName || null,
            address: address || customer.address,
          },
        });
      }
      // ถ้าไม่มีหมายเลขโทรศัพท์แต่จะสร้างลูกค้าใหม่โดยไม่ระบุหมายเลขโทรศัพท์
    } else if (fullName && !phoneNumber) {
      customer = await prisma.customer.findFirst({
        where: {
          fullName: fullName,
        },
      });
      const isSameCustomer = customer.fullName === fullName;

      if (!isSameCustomer) {
        customer = await prisma.customer.create({
          data: {
            fullName: fullName,
            address: address || null,
            phoneNumber: null,
          },
        });
      }
    }

    // สร้างการซ่อม
    const repair = await prisma.repair.create({
      data: {
        description: description || null,
        totalPrice,
        source: source,
        user: { connect: { id: req.user.id } },
        vehicle: { connect: { id: vehicle.id } },
        ...(customer ? { customer: { connect: { id: customer.id } } } : {}),
      },
    });

    // สร้างรายการซ่อม
    if (repairItems) {
      const repairItemsData = repairItems.map((item) => ({
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        side: item.side || null,
        repairId: repair.id,
        partId: item.partId,
        serviceId: item.serviceId,
      }));

      // บันทึกรายการซ่อมในฐานข้อมูล
      await prisma.repairItem.createMany({
        data: repairItemsData,
      });

      // อัปเดตจำนวนสต็อกของชิ้นส่วนที่ใช้ในการซ่อม
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
    const {
      fullName,
      address,
      phoneNumber,
      brand,
      model,
      plateNumber,
      province,
      description,
      totalPrice,
      source,
      repairItems,
    } = req.body;

    // เตรียมข้อมูล VehicleBrandModel
    let vehicleBrandModel = await prisma.vehicleBrandModel.findUnique({
      where: { brand_model: { brand, model } },
    });

    if (!vehicleBrandModel) {
      vehicleBrandModel = await prisma.vehicleBrandModel.create({
        data: { brand, model },
      });
    }

    // จัดการทะเบียนและยานพาหนะ
    let vehicle;
    if (plateNumber && province) {
      let licensePlate = await prisma.licensePlate.findUnique({
        where: { plateNumber_province: { plateNumber, province } },
      });
      if (!licensePlate) {
        licensePlate = await prisma.licensePlate.create({
          data: { plateNumber, province },
        });
      }

      // อัปเดตรถของงานซ่อมนี้ให้ชี้ไปยังรุ่นและทะเบียนที่ระบุ
      const currentRepair = await prisma.repair.findUnique({
        where: { id: Number(id) },
        select: { vehicleId: true },
      });
      vehicle = await prisma.vehicle.upsert({
        where: { id: currentRepair.vehicleId },
        update: {
          vehicleBrandModelId: vehicleBrandModel.id,
          licensePlateId: licensePlate.id,
        },
        create: {
          vehicleBrandModelId: vehicleBrandModel.id,
          licensePlateId: licensePlate.id,
        },
      });
    } else {
      const currentRepair = await prisma.repair.findUnique({
        where: { id: Number(id) },
        select: { vehicleId: true },
      });
      vehicle = await prisma.vehicle.update({
        where: { id: currentRepair.vehicleId },
        data: {
          vehicleBrandModelId: vehicleBrandModel.id,
          licensePlateId: null,
        },
      });
    }

    // จัดการลูกค้า
    let customer = null;
    if (phoneNumber) {
      customer = await prisma.customer.findUnique({
        where: { phoneNumber },
      });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            fullName: fullName || null,
            address: address || null,
            phoneNumber,
          },
        });
      } else if (fullName || address) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            fullName: fullName || null,
            address: address || customer.address,
          },
        });
      }
    } else if (fullName && !phoneNumber) {
      customer = await prisma.customer.findFirst({ where: { fullName } });
      if (!customer) {
        customer = await prisma.customer.create({
          data: { fullName, address: address || null, phoneNumber: null },
        });
      }
    }

    // คำนวณปรับสต็อก: คืนสต็อกจากรายการเดิม แล้วตัดสต็อกจากรายการใหม่
    const existingItems = await prisma.repairItem.findMany({
      where: { repairId: Number(id) },
      include: { part: true },
    });

    // คืนสต็อกของรายการเดิม
    for (const item of existingItems) {
      if (item.partId) {
        await prisma.part.update({
          where: { id: item.partId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }
    }

    // ลบรายการเดิมทั้งหมด
    await prisma.repairItem.deleteMany({ where: { repairId: Number(id) } });

    // เพิ่มรายการใหม่ และตัดสต็อกใหม่
    if (Array.isArray(repairItems)) {
      const dataItems = repairItems.map((item) => ({
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        side: item.side || null,
        repairId: Number(id),
        partId: item.partId,
        serviceId: item.serviceId,
      }));
      if (dataItems.length) {
        await prisma.repairItem.createMany({ data: dataItems });
      }
      for (const item of repairItems) {
        if (item.partId) {
          await prisma.part.update({
            where: { id: item.partId },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        }
      }
    }

    // อัปเดตหัวตารางซ่อม
    const updatedRepair = await prisma.repair.update({
      where: { id: Number(id) },
      data: {
        description: description || null,
        totalPrice,
        source,
        vehicle: { connect: { id: vehicle.id } },
        ...(customer
          ? { customer: { connect: { id: customer.id } } }
          : { customer: { disconnect: true } }),
      },
      include: {
        vehicle: {
          include: {
            licensePlate: {
              select: { plateNumber: true, province: true },
            },
            vehicleBrandModel: { select: { brand: true, model: true } },
          },
        },
        customer: true,
        user: { select: { fullName: true, nickname: true } },
        repairItems: {
          include: {
            part: { include: { category: true } },
            service: { include: { category: true } },
          },
        },
      },
    });

    res.json({ message: "Repair updated successfully" });
  } catch (error) {
    next(error);
  }
};

exports.updateRepairStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod } = req.body;

    // ดึงข้อมูลการซ่อมปัจจุบันเพื่อเช็คสถานะเดิม
    const currentRepair = await prisma.repair.findUnique({
      where: { id: Number(id) },
      select: { status: true, completedAt: true },
    });

    const updatedData = { status };

    if (status === "COMPLETED") {
      updatedData.completedAt = new Date();
    } else if (status === "PAID") {
      updatedData.paidAt = new Date();

      // ถ้าข้ามจาก IN_PROGRESS ไปเป็น PAID โดยตรง ให้เซ็ต completedAt ด้วย
      if (
        currentRepair.status === "IN_PROGRESS" &&
        !currentRepair.completedAt
      ) {
        updatedData.completedAt = new Date();
      }

      // ถ้ามี paymentMethod ให้อัปเดตด้วย
      if (paymentMethod) {
        const validPaymentMethods = ["CASH", "CREDIT_CARD", "BANK_TRANSFER"];
        if (validPaymentMethods.includes(paymentMethod)) {
          updatedData.paymentMethod = paymentMethod;
        }
      }
    }

    const updatedRepair = await prisma.repair.update({
      where: { id: Number(id) },
      data: updatedData,
      include: {
        vehicle: {
          include: {
            licensePlate: true,
            vehicleBrandModel: {
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
            id: true,
            fullName: true,
            nickname: true,
            email: true,
          },
        },
        repairItems: {
          include: {
            part: {
              include: {
                category: true,
              },
            },
            service: true,
          },
        },
      },
    });

    res.json(updatedRepair);
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
