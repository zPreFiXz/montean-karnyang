const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const {
  buildPartItemName,
  buildServiceItemName,
  isUnlimitedStockPart,
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
// existingCustomer = ลูกค้าที่ผูกกับบิลอยู่ก่อนแก้ไข (บิลใหม่จะเป็น null)
//
// แก้บิลเดิม: ถือว่าฟอร์มคือข้อมูลล่าสุดของลูกค้ารายนั้น ทั้งสามช่องแก้ได้อิสระต่อกัน
// รวมถึงลบทิ้ง เพราะคนกรอกเห็นข้อมูลเดิมอยู่ตรงหน้าแล้วตั้งใจแก้
//
// บิลใหม่: ช่องที่เว้นว่างไม่เอาไปทับของเดิม เพราะบิลแต่ละใบกรอกลูกค้าไม่ครบเท่ากัน
// (ขายหน้าร้านมักกรอกแต่เบอร์) ถ้าเอาช่องว่างไปทับ ที่อยู่ที่เคยเก็บไว้จะหายทันที
const resolveCustomer = async (
  tx,
  { name, address, phoneNumber },
  existingCustomer = null,
) => {
  const isEmpty = !name && !address && !phoneNumber;

  // เขียนทับเฉพาะช่องที่กรอกมา — ใช้กับลูกค้ารายอื่นที่ไม่ได้เปิดแก้อยู่
  const mergeInto = (customer) => ({
    name: name || customer.name,
    address: address || customer.address,
    phoneNumber: phoneNumber || customer.phoneNumber,
  });

  if (existingCustomer) {
    // เบอร์หรือชื่อที่กรอกมาไปตรงกับลูกค้ารายอื่นที่มีอยู่แล้ว = บิลนี้เป็นของคนนั้น
    // ย้ายบิลไปหาเขาแทนการแก้ชื่อรายเดิมทับ ไม่งั้นจะได้ลูกค้าชื่อซ้ำกันสองราย
    const claimedByOther = phoneNumber
      ? await tx.customer.findUnique({ where: { phoneNumber } })
      : name
        ? await tx.customer.findFirst({ where: { name } })
        : null;

    if (claimedByOther && claimedByOther.id !== existingCustomer.id) {
      return tx.customer.update({
        where: { id: claimedByOther.id },
        data: mergeInto(claimedByOther),
      });
    }

    if (isEmpty) {
      // ลบข้อมูลลูกค้าออกจนหมด = ตัดออกจากบิล
      // ถ้าไม่มีบิลใบอื่นใช้รายนี้แล้วก็เก็บกวาดทิ้ง ไม่ให้เหลือลูกค้าว่างเปล่าค้างในระบบ
      const usedBy = await tx.repair.count({
        where: { customerId: existingCustomer.id },
      });
      if (usedBy <= 1) {
        await tx.repair.updateMany({
          where: { customerId: existingCustomer.id },
          data: { customerId: null },
        });
        await tx.customer.delete({ where: { id: existingCustomer.id } });
      }
      return null;
    }

    return tx.customer.update({
      where: { id: existingCustomer.id },
      data: {
        name: name || null,
        address: address || null,
        phoneNumber: phoneNumber || null,
      },
    });
  }

  if (isEmpty) return null;

  if (phoneNumber) {
    const byPhone = await tx.customer.findUnique({ where: { phoneNumber } });

    if (byPhone) {
      return tx.customer.update({
        where: { id: byPhone.id },
        data: mergeInto(byPhone),
      });
    }

    return tx.customer.create({
      data: { name: name || null, address: address || null, phoneNumber },
    });
  }

  if (name) {
    const byName = await tx.customer.findFirst({ where: { name } });

    if (byName) {
      // ที่อยู่ที่กรอกมาต้องเขียนทับของเดิมด้วย ไม่ใช่คืนรายเดิมไปทั้งดุ้น
      if (address && address !== byName.address) {
        return tx.customer.update({
          where: { id: byName.id },
          data: { address },
        });
      }
      return byName;
    }

    return tx.customer.create({
      data: { name, address: address || null, phoneNumber: null },
    });
  }

  // เหลือแต่ที่อยู่ (เช่นงานบริการนอกสถานที่ที่รู้แต่จุดที่ไป) ไม่มีอะไรให้จับคู่กับรายเดิม
  // ยังต้องเก็บ ไม่งั้นที่พิมพ์ไว้หายไปเงียบๆ ตอนบันทึก
  return tx.customer.create({
    data: { name: null, address, phoneNumber: null },
  });
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

// ใบประเมินราคายังไม่ได้ลงมือซ่อม ของจึงต้องอยู่ในคลังตามเดิม
// ย้ายเข้า/ออกจากสถานะนี้เมื่อไหร่ก็คืนหรือตัดสต็อกให้ตรงกับความจริงตอนนั้น
const restoreStockForRepair = async (tx, repairId) => {
  const items = await tx.repairItem.findMany({
    where: { repairId },
    include: { part: { select: { name: true } } },
  });

  for (const item of items) {
    if (!item.partId || isUnlimitedStockPart(item.part)) continue;

    await tx.part.update({
      where: { id: item.partId },
      data: { stockQuantity: { increment: item.quantity } },
    });
    await restoreTireLotsFromSoldLots(tx, item.partId, item.soldLots);
    // ล็อตถูกคืนเข้าคลังแล้ว บรรทัดนี้จึงไม่ได้ถืออะไรอยู่
    await tx.repairItem.update({
      where: { id: item.id },
      data: { soldLots: Prisma.DbNull },
    });
  }
};

const deductStockForRepair = async (tx, repairId) => {
  const items = await tx.repairItem.findMany({
    where: { repairId },
    include: { part: { select: { name: true } } },
  });

  for (const item of items) {
    if (!item.partId || isUnlimitedStockPart(item.part)) continue;

    const soldLots = await deductTireLotsFifo(tx, item.partId, item.quantity);
    await tx.part.update({
      where: { id: item.partId },
      data: { stockQuantity: { decrement: item.quantity } },
    });
    await tx.repairItem.update({
      where: { id: item.id },
      data: { soldLots: soldLots ?? Prisma.DbNull },
    });
  }
};

// บันทึกรายการซ่อมย่อยชุดใหม่ พร้อมตัดสต็อกอะไหล่ที่ใช้
const createRepairItemsAndDecrementStock = async (
  tx,
  repairId,
  repairItems,
  // ใบประเมินราคาบันทึกรายการอย่างเดียว ของยังไม่ได้ถูกเบิกออกจากคลัง
  deductStock = true,
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
    // ของที่ตวงจากถังใหญ่ (น้ำมันเกียร์) ไม่ได้นับเป็นชิ้น ตัดสต็อกแล้วเลขจะติดลบไปเรื่อยๆ
    // จึงบันทึกลงบิลอย่างเดียว ไม่แตะสต็อก
    if (
      deductStock &&
      item.partId &&
      !isUnlimitedStockPart(partById.get(item.partId))
    ) {
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
        // ช่อง JSON ถ้าส่ง null ธรรมดา Prisma จะเก็บเป็นคำว่า null ในช่อง ไม่ใช่ช่องว่างของฐานข้อมูล
        // ต้องบอกด้วย DbNull ว่าให้เว้นช่องไว้จริงๆ (รายการที่ไม่ใช่ยางไม่มีล็อตให้เก็บ)
        soldLots: soldLots ?? Prisma.DbNull,
        repairId,
        partId: item.partId,
        serviceId: item.serviceId,
        // บริการพิมพ์ชื่อเองได้ จึงใช้ชื่อที่ส่งมาก่อน แล้วค่อยตกไปที่ชื่อในคลัง
        // ส่วนอะไหล่ยังประกอบจากข้อมูลจริงเสมอ ไม่รับชื่อจากหน้าเว็บ
        itemName: item.partId
          ? buildPartItemName(partById.get(item.partId))
          : item.itemName?.trim() ||
            buildServiceItemName(serviceById.get(item.serviceId)),
      },
    });
  }
};

exports.listRepairs = async (req, res, next) => {
  try {
    const repairs = await prisma.repair.findMany({
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        // ชื่อรายการใช้ตั้งหัวการ์ดของบิลที่ไม่ผูกกับรถ (ดู getRepairTitle ฝั่งหน้าเว็บ)
        // partId ไว้แยกว่าบรรทัดไหนเป็นอะไหล่ หัวการ์ดเอาเฉพาะชื่องานบริการ
        repairItems: {
          select: {
            itemName: true,
            partId: true,
          },
        },
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
      noVehicle,
      repairItems,
    } = req.body;

    // ห่อทั้งหมดใน transaction: ถ้าพังกลางทางจะ rollback ไม่เหลือข้อมูลค้างครึ่ง
    const isSale = type === "SALE";
    // ไม่ผูกกับรถ: บิลขายหน้าร้าน หรืองานบริการที่ไม่เก็บประวัติรถ
    // ข้ามการหา/สร้างรถกับทะเบียนทั้งหมด บิลจึงไม่ไปโผล่ในประวัติรถคันไหน
    const skipVehicle = isSale || !!noVehicle;

    await prisma.$transaction(async (tx) => {
      let vehicle = null;
      let licensePlate;

      const vehicleModel = skipVehicle
        ? null
        : await findOrCreateVehicleModel(tx, brand, model);

      if (skipVehicle) {
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

      // ขายหน้าร้าน = ลูกค้าจ่ายแล้วเดินออกไปเลย จึงบันทึกจบในครั้งเดียว
      // ต่างจากงานบริการที่อาจเก็บเงินทีหลัง จึงเดินสถานะปกติเหมือนงานซ่อม
      //
      // ยกเว้นเลือกเครดิต = ของออกจากร้านแล้วแต่ยังไม่ได้เงิน บิลไปพักที่สถานะเครดิต
      // ไม่มีเวลาชำระเงินและไม่เก็บวิธีจ่าย ยอดจึงยังไม่เข้ารายงานจนกว่าจะตัดเครดิต
      const isCreditSale = isSale && paymentMethod === "CREDIT";
      const paidNow = isSale && !isCreditSale ? new Date() : null;

      const repair = await tx.repair.create({
        data: {
          description: description || null,
          mileage: mileage ?? null,
          totalPrice,
          type,
          ...(isCreditSale
            ? { status: "CREDIT", completedAt: new Date() }
            : isSale
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
      noVehicle,
      repairItems,
    } = req.body;

    // ห่อทั้งหมดใน transaction: คืนสต็อก + ลบ/สร้างรายการใหม่ + อัปเดตบิล ต้อง atomic
    const isSale = type === "SALE";
    const skipVehicle = isSale || !!noVehicle;

    await prisma.$transaction(async (tx) => {
      const vehicleModel = skipVehicle
        ? null
        : await findOrCreateVehicleModel(tx, brand, model);

      const currentRepair = await tx.repair.findUnique({
        where: { id: Number(id) },
        select: {
          vehicleId: true,
          status: true,
          customer: {
            select: { id: true, name: true, phoneNumber: true, address: true },
          },
        },
      });

      let vehicle = null;
      if (skipVehicle) {
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

      const customer = await resolveCustomer(
        tx,
        { name, address, phoneNumber },
        currentRepair.customer,
      );

      // ใบประเมินราคายังไม่เคยตัดสต็อก จึงไม่มีอะไรให้คืนและไม่ต้องตัดของชุดใหม่
      // (คืนไปจะกลายเป็นสต็อกงอก แล้วตัดใหม่จะกลายเป็นของหายทั้งที่ยังไม่ได้ซ่อม)
      const isEstimate = currentRepair.status === "ESTIMATE";

      // คืนสต็อกจากรายการเดิม ก่อนลบทิ้ง
      const existingItems = await tx.repairItem.findMany({
        where: { repairId: Number(id) },
        include: { part: { select: { name: true } } },
      });

      if (!isEstimate) {
        for (const item of existingItems) {
          // ของที่ตวงจากถังใหญ่ไม่เคยถูกตัดสต็อก จึงไม่มีอะไรให้คืน คืนไปจะกลายเป็นสต็อกงอก
          if (item.partId && !isUnlimitedStockPart(item.part)) {
            await tx.part.update({
              where: { id: item.partId },
              data: { stockQuantity: { increment: item.quantity } },
            });
            await restoreTireLotsFromSoldLots(tx, item.partId, item.soldLots);
          }
        }
      }

      await tx.repairItem.deleteMany({ where: { repairId: Number(id) } });

      if (repairItems?.length) {
        await createRepairItemsAndDecrementStock(
          tx,
          Number(id),
          repairItems,
          !isEstimate,
        );
      }

      await tx.repair.update({
        where: { id: Number(id) },
        data: {
          description: description || null,
          mileage: mileage ?? null,
          totalPrice,
          type,
          // บิลขายหน้าร้าน: ช่องวิธีชำระเงินในหน้าแก้ไขทำหน้าที่สลับระหว่าง "ได้เงินแล้ว" กับ "ติดเครดิต"
          // เลือกวิธีจ่ายจริงให้บิลที่ติดเครดิตอยู่ = ตัดเครดิต ยอดเข้ารายงานของวันที่ตัด
          // เลือกเครดิตให้บิลที่บันทึกว่าจ่ายแล้ว = แก้ที่บันทึกผิด ล้างเวลาชำระเงินกับวิธีจ่ายทิ้ง
          ...(isSale && paymentMethod
            ? paymentMethod === "CREDIT"
              ? { status: "CREDIT", paidAt: null, paymentMethod: null }
              : {
                  paymentMethod,
                  ...(currentRepair.status === "CREDIT"
                    ? { status: "PAID", paidAt: new Date() }
                    : {}),
                }
            : {}),
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
        include: { part: { select: { name: true } } },
      });

      // ใบประเมินราคาไม่เคยเบิกของออกจากคลัง ลบทิ้งจึงไม่มีอะไรให้คืน
      if (repair.status !== "ESTIMATE") {
        for (const item of items) {
          if (item.partId && !isUnlimitedStockPart(item.part)) {
            await tx.part.update({
              where: { id: item.partId },
              data: { stockQuantity: { increment: item.quantity } },
            });
            await restoreTireLotsFromSoldLots(tx, item.partId, item.soldLots);
          }
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
    } else if (status === "CREDIT") {
      // ติดเงินไว้ = ซ่อมเสร็จแล้วแต่ยังไม่ได้เงิน ไม่ตั้งเวลาชำระเงินและไม่เก็บวิธีจ่าย
      // ยอดจะยังไม่ไปโผล่ในรายงานยอดขายจนกว่าจะตัดเครดิต
      if (!repair.completedAt) {
        data.completedAt = new Date();
      }
      data.paymentMethod = null;
    } else if (status === "PAID") {
      // บิลที่จ่ายแล้วและแค่มาแก้วิธีชำระเงิน ต้องคงเวลาที่เก็บเงินไว้ตามเดิม
      // ไม่งั้นยอดจะย้ายไปอยู่ในรายงานของวันที่มาแก้ ทั้งที่เงินเข้าไปตั้งแต่วันก่อน
      data.paidAt = repair.paidAt ?? new Date();

      if (repair.status === "IN_PROGRESS" && !repair.completedAt) {
        data.completedAt = new Date();
      }

      if (paymentMethod) {
        data.paymentMethod = paymentMethod;
      }
    }

    // เข้า/ออกใบประเมินราคาต้องขยับสต็อกด้วย จึงทำในรายการเดียวกับการเปลี่ยนสถานะ
    // ถ้าตัดสต็อกไม่ผ่าน (ของถูกใช้ไปหมดระหว่างรอ) สถานะก็ต้องไม่เปลี่ยนตาม
    const toEstimate = status === "ESTIMATE" && repair.status !== "ESTIMATE";
    const fromEstimate = repair.status === "ESTIMATE" && status !== "ESTIMATE";

    if (toEstimate) {
      // ยังไม่ซ่อม จึงไม่มีเวลาซ่อมเสร็จ ไม่มีเวลาชำระเงิน และยังไม่รู้ว่าจะจ่ายทางไหน
      data.completedAt = null;
      data.paidAt = null;
      data.paymentMethod = null;
    }

    await prisma.$transaction(async (tx) => {
      if (toEstimate) await restoreStockForRepair(tx, Number(id));
      if (fromEstimate) await deductStockForRepair(tx, Number(id));

      await tx.repair.update({
        where: { id: Number(id) },
        data,
      });
    });

    res.json({
      message: "อัปเดตสถานะการซ่อมเรียบร้อยแล้ว",
    });
  } catch (error) {
    next(error);
  }
};
