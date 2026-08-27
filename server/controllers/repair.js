const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const {
  buildPartItemName,
  buildServiceItemName,
} = require("../utils/repairItemName");

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

// เรียงล็อตเก่าสุดก่อน (FIFO): DOT รูปแบบ WWYY → เทียบปี(YY) ก่อน แล้วสัปดาห์(WW)
// ล็อต "ไม่ระบุ" (backfill) หรือรูปแบบผิด ถือว่าเก่าสุด ขายออกก่อน
const dotOrderKey = (dotCode) => {
  const matched = /^(\d{2})(\d{2})$/.exec(dotCode || "");
  if (!matched) return -1;
  const [, week, year] = matched;
  return Number(year) * 100 + Number(week);
};

// ตัดสต็อกยางแบบ FIFO ข้ามหลายล็อตได้ คืนล็อตที่ตัด [{ dotCode, quantity }]
// คืน null ถ้า Part ไม่มีล็อต (ไม่ใช่ยางที่ track ล็อต) → ให้ผู้เรียกตัด stockQuantity แบบเดิม
const deductTireLotsFifo = async (tx, partId, quantity) => {
  const lots = await tx.tireLot.findMany({ where: { partId } });
  if (!lots.length) return null;

  lots.sort((a, b) => dotOrderKey(a.dotCode) - dotOrderKey(b.dotCode));

  let remaining = quantity;
  const consumed = [];
  for (const lot of lots) {
    if (remaining <= 0) break;
    const take = Math.min(lot.quantity, remaining);
    if (take <= 0) continue;
    remaining -= take;
    consumed.push({ dotCode: lot.dotCode, quantity: take });
    const left = lot.quantity - take;
    if (left <= 0) {
      await tx.tireLot.delete({ where: { id: lot.id } });
    } else {
      await tx.tireLot.update({
        where: { id: lot.id },
        data: { quantity: left },
      });
    }
  }
  return consumed.length ? consumed : null;
};

// คืนล็อตยางกลับตอนแก้/ยกเลิกบิล จากล็อตที่บันทึกไว้ [{ dotCode, quantity }]
const restoreTireLotsFromSoldLots = async (tx, partId, soldLots) => {
  if (!Array.isArray(soldLots)) return;
  for (const lot of soldLots) {
    const dot = String(lot?.dotCode ?? "").trim();
    const qty = Number(lot?.quantity);
    if (!dot || !Number.isFinite(qty) || qty <= 0) continue;

    const existing = await tx.tireLot.findFirst({
      where: { partId, dotCode: dot },
    });
    if (existing) {
      await tx.tireLot.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + qty },
      });
    } else {
      await tx.tireLot.create({
        data: { partId, dotCode: dot, quantity: qty },
      });
    }
  }
};

// บันทึกรายการซ่อมย่อยชุดใหม่ พร้อมตัดสต็อกอะไหล่ที่ใช้
const createRepairItemsAndDecrementStock = async (
  tx,
  repairId,
  repairItems,
) => {
  // snapshot ชื่อ ณ วันซ่อม เผื่ออะไหล่ถูกลบภายหลัง ประวัติจะยังมีชื่อ
  const partIds = repairItems.map((i) => i.partId).filter(Boolean);
  const serviceIds = repairItems.map((i) => i.serviceId).filter(Boolean);

  const [parts, services] = await Promise.all([
    partIds.length
      ? tx.part.findMany({
          where: { id: { in: partIds } },
          select: {
            id: true,
            brand: true,
            name: true,
            attributes: true,
            category: { select: { name: true } },
          },
        })
      : [],
    serviceIds.length
      ? tx.service.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, name: true },
        })
      : [],
  ]);

  const partById = new Map(parts.map((p) => [p.id, p]));
  const serviceById = new Map(services.map((s) => [s.id, s]));

  // สร้างทีละรายการ: ยางต้องตัดล็อต FIFO ก่อนเพื่อรู้ DOT ที่ขาย แล้วบันทึกลง RepairItem
  for (const item of repairItems) {
    let soldLots = null;
    if (item.partId) {
      soldLots = await deductTireLotsFifo(tx, item.partId, item.quantity);
      await tx.part.update({
        where: { id: item.partId },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }

    await tx.repairItem.create({
      data: {
        side: item.side || null,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        soldLots,
        repairId,
        partId: item.partId,
        serviceId: item.serviceId,
        itemName: item.partId
          ? buildPartItemName(partById.get(item.partId))
          : buildServiceItemName(serviceById.get(item.serviceId)),
      },
    });
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
      paymentMethod,
      repairItems,
    } = req.body;

    // ห่อทั้งหมดใน transaction: ถ้าพังกลางทางจะ rollback ไม่เหลือข้อมูลค้างครึ่ง
    // ขายอะไหล่หน้าร้าน: ไม่มีรถมาเกี่ยว ข้ามการหา/สร้างรถกับทะเบียนทั้งหมด
    const isSale = type === "SALE";

    await prisma.$transaction(async (tx) => {
      let vehicle = null;
      let licensePlate;

      const vehicleModel = isSale
        ? null
        : await findOrCreateVehicleModel(tx, brand, model);

      if (isSale) {
        vehicle = null;
      } else if (plate && province) {
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

      const customer = await resolveCustomer(tx, {
        name,
        address,
        phoneNumber,
      });

      // ขายหน้าร้าน = เก็บเงินตรงนั้นเลย ไม่มีช่วงที่ของค้างอยู่ที่ร้าน
      // จึงบันทึกจบในครั้งเดียว ไม่ต้องให้พนักงานไล่กดเปลี่ยนสถานะอีกสองรอบ
      const paidNow = isSale ? new Date() : null;

      const repair = await tx.repair.create({
        data: {
          description: description || null,
          mileage: mileage ?? null,
          totalPrice,
          type,
          ...(isSale
            ? {
                status: "PAID",
                completedAt: paidNow,
                paidAt: paidNow,
                paymentMethod: paymentMethod || "CASH",
              }
            : {}),
          user: { connect: { id: req.user.id } },
          ...(vehicle ? { vehicle: { connect: { id: vehicle.id } } } : {}),
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
      paymentMethod,
      repairItems,
    } = req.body;

    // ห่อทั้งหมดใน transaction: คืนสต็อก + ลบ/สร้างรายการใหม่ + อัปเดตบิล ต้อง atomic
    const isSale = type === "SALE";

    await prisma.$transaction(async (tx) => {
      const vehicleModel = isSale
        ? null
        : await findOrCreateVehicleModel(tx, brand, model);

      const currentRepair = await tx.repair.findUnique({
        where: { id: Number(id) },
        select: { vehicleId: true },
      });

      let vehicle = null;
      if (isSale) {
        vehicle = null;
      } else if (plate && province) {
        let licensePlate = await tx.licensePlate.findUnique({
          where: { plateNumber_province: { plateNumber: plate, province } },
        });
        if (!licensePlate) {
          licensePlate = await tx.licensePlate.create({
            data: { plateNumber: plate, province },
          });
        }

        vehicle = await tx.vehicle.upsert({
          where: { id: currentRepair.vehicleId ?? 0 },
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
        } else if (currentRepair.vehicleId) {
          vehicle = await tx.vehicle.update({
            where: { id: currentRepair.vehicleId },
            data: { vehicleModelId: vehicleModel.id, licensePlateId: null },
          });
        } else {
          // บิลเดิมเป็นการขายหน้าร้าน ยังไม่เคยมีรถผูกไว้
          vehicle = await tx.vehicle.create({
            data: { vehicleModelId: vehicleModel.id, licensePlateId: null },
          });
        }
      }

      const customer = await resolveCustomer(tx, {
        name,
        address,
        phoneNumber,
      });

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
          await restoreTireLotsFromSoldLots(tx, item.partId, item.soldLots);
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
          ...(isSale && paymentMethod ? { paymentMethod } : {}),
          ...(vehicle
            ? { vehicle: { connect: { id: vehicle.id } } }
            : { vehicle: { disconnect: true } }),
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

// ลบบิลทิ้ง: ต้องคืนสต็อกก่อนเสมอ ไม่งั้นอะไหล่จะหายจากคลังทั้งที่ไม่ได้ขายออกไป
// ใช้ตรรกะคืนของชุดเดียวกับตอนแก้ไขบิล (คืนจำนวน + คืนล็อตยางตาม soldLots)
exports.deleteRepair = async (req, res, next) => {
  try {
    const { id } = req.params;

    const repair = await prisma.repair.findUnique({
      where: { id: Number(id) },
    });

    if (!repair) {
      createError(404, "ไม่พบรายการซ่อม");
    }

    await prisma.$transaction(async (tx) => {
      const items = await tx.repairItem.findMany({
        where: { repairId: Number(id) },
      });

      for (const item of items) {
        if (item.partId) {
          await tx.part.update({
            where: { id: item.partId },
            data: { stockQuantity: { increment: item.quantity } },
          });
          await restoreTireLotsFromSoldLots(tx, item.partId, item.soldLots);
        }
      }

      await tx.repairItem.deleteMany({ where: { repairId: Number(id) } });
      await tx.repair.delete({ where: { id: Number(id) } });
    });

    res.json({ message: "ลบรายการซ่อมเรียบร้อยแล้ว" });
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
