const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const { OIL_SOURCE_SELECT, withOilKitStock } = require("../utils/oilKit");
const { buildReceiptHtml, buildJobSheetHtml } = require("../utils/receiptHtml");
const { printReceipt, htmlToImages } = require("../utils/printReceipt");
const {
  assignRepairDocumentNo,
  releaseRepairDocumentNo,
  releaseReceiptNo,
  docNosSkippedOnDelete,
} = require("../utils/documentNumber");
const {
  resolveVehicleForNewBill,
  resolveVehicleForEdit,
  removeOrphanVehicle,
} = require("../utils/repairVehicle");
const { resolveCustomer } = require("../utils/repairCustomer");
const {
  checkAlignmentRedeems,
  pendingAlignmentsFor,
  lateAlignmentPairs,
} = require("../utils/repairAlignment");
const {
  restoreTireLotsFromSoldLots,
  moveStock,
  restoreStockForRepair,
  deductStockForRepair,
  createRepairItemsAndDecrementStock,
} = require("../utils/repairStock");

exports.listRepairs = async (req, res) => {
  const repairs = await prisma.repair.findMany({
    include: {
      customer: {
        select: {
          name: true,
          organizationType: true,
        },
      },
      // ชื่อรายการใช้ตั้งหัวการ์ดของบิลที่ไม่ผูกรถ (ดู getRepairTitle ฝั่งหน้าเว็บ)
      // หมวดใช้ติดป้ายบิลงานซ่อมที่มีอะไหล่ช่วงล่าง (ควรเปิดเป็นเช็กช่วงล่าง)
      repairItems: {
        select: {
          itemName: true,
          partId: true,
          part: { select: { category: { select: { name: true } } } },
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
};

// เลขเอกสารของเดือนหนึ่งเรียงครบตั้งแต่ 0001 ถึงเลขล่าสุดที่ออก เลขที่ไม่มีเอกสารคือบิลที่ถูกลบไปแล้ว
const DOC_NO_FIELDS = { RE: "receiptNo", DO: "deliveryNo", QT: "quotationNo" };
const DOC_NO_PREFIXES = [...Object.keys(DOC_NO_FIELDS), "BL"];

exports.listDocumentNumbers = async (req, res) => {
  const prefix = String(req.query.prefix || "");
  const period = String(req.query.period || "");
  if (!DOC_NO_PREFIXES.includes(prefix) || !/^\d{4}$/.test(period)) {
    createError(400, "ประเภทเอกสารหรือเดือนไม่ถูกต้อง");
  }

  const start = `${prefix}-${period}-`;
  const counter = await prisma.documentCounter.findUnique({
    where: { prefix_period: { prefix, period } },
  });

  const docs =
    prefix === "BL"
      ? (
          await prisma.billingNote.findMany({
            where: { number: { startsWith: start } },
            select: {
              number: true,
              createdAt: true,
              customer: {
                select: { id: true, name: true, organizationType: true },
              },
            },
          })
        ).map((note) => ({ no: note.number, billingNote: note }))
      : (
          await prisma.repair.findMany({
            where: { [DOC_NO_FIELDS[prefix]]: { startsWith: start } },
            include: {
              customer: { select: { name: true, organizationType: true } },
              repairItems: {
                select: {
                  itemName: true,
                  partId: true,
                  part: { select: { category: { select: { name: true } } } },
                },
              },
              vehicle: {
                include: {
                  licensePlate: {
                    select: { plateNumber: true, province: true },
                  },
                  vehicleModel: { select: { brand: true, model: true } },
                },
              },
            },
          })
        ).map((repair) => ({ no: repair[DOC_NO_FIELDS[prefix]], repair }));

  const bySeq = new Map(
    docs.map((doc) => [Number(doc.no.slice(start.length)), doc]),
  );
  const lastNo = Math.max(counter?.lastNo || 0, ...bySeq.keys(), 0);
  const entries = Array.from({ length: lastNo }, (_, index) => {
    const seq = index + 1;
    const no = `${start}${String(seq).padStart(4, "0")}`;
    return bySeq.get(seq) || { no, missing: true };
  });

  res.json({ prefix, period, lastNo, entries });
};

exports.listLateAlignments = async (req, res) => {
  res.json(await lateAlignmentPairs(prisma));
};

// ธนาคารที่เคยรับเช็ค ไว้เป็นตัวเลือกตอนกรอก ใช้บ่อยขึ้นก่อน ชื่อจะได้สะกดตรงกันทุกบิล
exports.listChequeBanks = async (req, res) => {
  const rows = await prisma.repair.groupBy({
    by: ["chequeBank"],
    where: { chequeBank: { not: null } },
    _count: { _all: true },
  });
  const collator = new Intl.Collator("th");
  res.json(
    rows
      .filter((row) => String(row.chequeBank || "").trim())
      .sort(
        (a, b) =>
          b._count._all - a._count._all ||
          collator.compare(a.chequeBank, b.chequeBank),
      )
      .map((row) => row.chequeBank),
  );
};

exports.getRepair = async (req, res) => {
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
              oilSource: OIL_SOURCE_SELECT,
            },
          },
          service: {
            include: {
              category: true,
            },
          },
          alignmentFromRepair: {
            select: { id: true, receiptNo: true, createdAt: true },
          },
        },
      },
      // สิทธิ์ตั้งศูนย์ที่ค้างในบิลนี้ ถูกใช้ไปในบิลไหนแล้ว
      alignmentRedeems: {
        where: { repair: { status: { not: "CANCELLED" } } },
        select: {
          repair: { select: { id: true, receiptNo: true, createdAt: true } },
        },
      },
    },
  });

  if (!repair) {
    createError(404, "ไม่พบงานซ่อม");
  }

  res.json({
    ...repair,
    // ชุดน้ำมันบอกสต็อกเป็นจำนวนชุด หน้าแก้ไขบิลจะได้กันเบิกเกินของจริง
    repairItems: repair.repairItems.map((item) =>
      item.part ? { ...item, part: withOilKitStock(item.part) } : item,
    ),
    docNosSkippedOnDelete: await docNosSkippedOnDelete(prisma, repair),
    // ส่งไปพร้อมหน้าแก้บิล แถวสิทธิ์ตั้งศูนย์จะขึ้นได้ตั้งแต่เฟรมแรก ไม่ต้องรอค้นทะเบียน
    pendingAlignments: await pendingAlignmentsFor(
      prisma,
      repair.vehicleId,
      repair.id,
    ),
  });
};

// อะไหล่อื่นๆ พิมพ์ชื่อเองจึงไม่มีหน่วยในคลัง ต้องมีหน่วยติดมากับบรรทัด (ต้องตรงกับ validateUnits ฝั่งหน้าเว็บ)
const PART_PLACEHOLDER_SERVICE_NAME = "อะไหล่อื่นๆ";
const requireUnitsForTypedParts = async (repairItems = []) => {
  const serviceIds = repairItems
    .filter((item) => item.serviceId && !String(item.itemUnit || "").trim())
    .map((item) => Number(item.serviceId));
  if (!serviceIds.length) return;
  const placeholder = await prisma.service.findFirst({
    where: { id: { in: serviceIds }, name: PART_PLACEHOLDER_SERVICE_NAME },
    select: { id: true },
  });
  if (placeholder) {
    createError(400, "กรุณากรอกหน่วยของอะไหล่อื่นๆ");
  }
};

exports.createRepair = async (req, res) => {
  const {
    name,
    address,
    taxId,
    phoneNumber,
    brand,
    model,
    plate,
    province,
    fleetNo,
    description,
    mileage,
    totalPrice,
    type,
    paymentMethod,
    noVehicle,
    repairItems,
  } = req.body;
  const fleet = fleetNo?.trim() || null;
  await requireUnitsForTypedParts(repairItems);

  const isSale = type === "SALE";
  const skipVehicle = isSale || !!noVehicle;

  await prisma.$transaction(async (tx) => {
    const vehicle = skipVehicle
      ? null
      : await resolveVehicleForNewBill(tx, {
          brand,
          model,
          plate,
          province,
          fleet,
        });

    const customer = await resolveCustomer(tx, {
      name,
      address,
      taxId,
      phoneNumber,
    });

    // ขายหน้าร้านบันทึกจบในครั้งเดียว ยกเว้นเลือกเครดิต บิลไปพักที่สถานะเครดิต ยอดยังไม่เข้ารายงาน
    // ชำระทีหลัง (ลูกค้าไปเอาเงินแป๊บเดียว) พักไว้ที่ซ่อมเสร็จสิ้นแบบงานซ่อมที่รอจ่าย ไม่ออกเลขใบส่งของ
    const isCreditSale = isSale && paymentMethod === "CREDIT";
    const isPayLaterSale = isSale && paymentMethod === "PAY_LATER";
    const paidNow =
      isSale && !isCreditSale && !isPayLaterSale ? new Date() : null;

    const repair = await tx.repair.create({
      data: {
        description: description || null,
        mileage: mileage ?? null,
        totalPrice,
        type,
        ...(isCreditSale
          ? { status: "CREDIT", completedAt: new Date() }
          : isPayLaterSale
            ? { status: "COMPLETED", completedAt: new Date() }
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
      await checkAlignmentRedeems(tx, repairItems, vehicle?.id, repair.id);
      await createRepairItemsAndDecrementStock(tx, repair.id, repairItems);
    }

    await assignRepairDocumentNo(tx, repair.id);
  });

  res.json({ message: "สร้างงานซ่อมเรียบร้อยแล้ว" });
};

exports.updateRepair = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    address,
    taxId,
    phoneNumber,
    brand,
    model,
    plate,
    province,
    fleetNo,
    description,
    mileage,
    totalPrice,
    type,
    paymentMethod,
    noVehicle,
    repairItems,
  } = req.body;
  const fleet = fleetNo?.trim() || null;
  await requireUnitsForTypedParts(repairItems);

  const isSale = type === "SALE";
  const skipVehicle = isSale || !!noVehicle;

  await prisma.$transaction(async (tx) => {
    const currentRepair = await tx.repair.findUnique({
      where: { id: Number(id) },
      select: {
        vehicleId: true,
        status: true,
        customer: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            address: true,
            taxId: true,
          },
        },
      },
    });

    if (currentRepair?.status === "CANCELLED") {
      createError(400, CANNOT_EDIT_CANCELLED);
    }

    const vehicle = skipVehicle
      ? null
      : await resolveVehicleForEdit(
          tx,
          { brand, model, plate, province, fleet },
          currentRepair.vehicleId,
        );

    const customer = await resolveCustomer(
      tx,
      { name, address, taxId, phoneNumber },
      currentRepair.customer,
    );

    // ใบเสนอราคายังไม่เคยตัดสต็อก ไม่มีอะไรให้คืนและไม่ต้องตัดใหม่
    const isEstimate = currentRepair.status === "ESTIMATE";

    const existingItems = await tx.repairItem.findMany({
      where: { repairId: Number(id) },
      include: {
        part: { select: { name: true, oilSourceId: true, oilLiters: true } },
      },
    });

    if (!isEstimate) {
      for (const item of existingItems) {
        if (item.partId) {
          await moveStock(
            tx,
            item.part,
            item.partId,
            item.quantity,
            "increment",
          );
          await restoreTireLotsFromSoldLots(tx, item.partId, item.soldLots);
        }
      }
    }

    await tx.repairItem.deleteMany({ where: { repairId: Number(id) } });

    if (repairItems?.length) {
      await checkAlignmentRedeems(tx, repairItems, vehicle?.id, Number(id));
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
        // บิลขาย: เลือกวิธีจ่ายให้บิลเครดิตหรือบิลรอชำระ = รับเงิน, เลือกเครดิต/ชำระทีหลังให้บิลที่จ่ายแล้ว = แก้ที่บันทึกผิด
        ...(isSale && paymentMethod
          ? paymentMethod === "CREDIT"
            ? { status: "CREDIT", paidAt: null, paymentMethod: null }
            : paymentMethod === "PAY_LATER"
              ? { status: "COMPLETED", paidAt: null, paymentMethod: null }
              : {
                  paymentMethod,
                  ...(["CREDIT", "COMPLETED"].includes(currentRepair.status)
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

    if (currentRepair.vehicleId !== vehicle?.id) {
      await removeOrphanVehicle(tx, currentRepair.vehicleId);
    }
    await assignRepairDocumentNo(tx, Number(id));
  });

  res.json({ message: "แก้ไขงานซ่อมเรียบร้อยแล้ว" });
};

const CANNOT_EDIT_CANCELLED = "แก้ไขไม่ได้ เพราะบิลนี้ยกเลิกแล้ว";

// ยกเลิกแทนการลบสำหรับบิลที่ไม่ใช่เลขล่าสุด เลขยังอยู่ ลำดับไม่ขาด
// คืนของเข้าคลัง และไม่นับเป็นยอดขายหรือครั้งที่มาซ่อม
exports.cancelRepair = async (req, res) => {
  const { id } = req.params;

  const repair = await prisma.repair.findUnique({
    where: { id: Number(id) },
  });
  if (!repair) {
    createError(404, "ไม่พบงานซ่อม");
  }
  if (repair.status === "CANCELLED") {
    createError(400, "บิลนี้ยกเลิกไปแล้ว");
  }

  await prisma.$transaction(async (tx) => {
    if (repair.status !== "ESTIMATE") {
      await restoreStockForRepair(tx, Number(id));
    }
    await tx.repair.update({
      where: { id: Number(id) },
      data: {
        status: "CANCELLED",
        cancelledStatus: repair.status,
        cancelledAt: new Date(),
      },
    });
  });

  res.json({ message: "ยกเลิกบิลเรียบร้อยแล้ว" });
};

// ลบได้เฉพาะบิลที่ทุกเลขเป็นเลขล่าสุด เลขจะคืนให้บิลถัดไป บิลอื่นต้องยกเลิกแทน
// ต้องคืนสต็อกก่อนเสมอ
exports.deleteRepair = async (req, res) => {
  const { id } = req.params;

  const repair = await prisma.repair.findUnique({
    where: { id: Number(id) },
  });

  if (!repair) {
    createError(404, "ไม่พบงานซ่อม");
  }

  if ((await docNosSkippedOnDelete(prisma, repair)).length > 0) {
    createError(
      400,
      "ลบไม่ได้ เพราะไม่ใช่บิลล่าสุด เลขที่บิลจะขาดช่วง ให้ยกเลิกบิลแทน",
    );
  }

  await prisma.$transaction(async (tx) => {
    const items = await tx.repairItem.findMany({
      where: { repairId: Number(id) },
      include: {
        part: { select: { name: true, oilSourceId: true, oilLiters: true } },
      },
    });

    // ใบเสนอราคาไม่เคยเบิกของออกจากคลัง บิลที่ยกเลิกคืนของไปแล้วตอนยกเลิก ลบทิ้งจึงไม่มีอะไรให้คืน
    if (!["ESTIMATE", "CANCELLED"].includes(repair.status)) {
      for (const item of items) {
        if (item.partId) {
          await moveStock(
            tx,
            item.part,
            item.partId,
            item.quantity,
            "increment",
          );
          await restoreTireLotsFromSoldLots(tx, item.partId, item.soldLots);
        }
      }
    }

    await tx.repairItem.deleteMany({ where: { repairId: Number(id) } });
    await releaseRepairDocumentNo(tx, repair);
    await tx.repair.delete({ where: { id: Number(id) } });
  });

  res.json({ message: "ลบงานซ่อมเรียบร้อยแล้ว" });
};

exports.updateRepairStatus = async (req, res) => {
  const { id } = req.params;
  // status/paymentMethod/เช็ค ผ่าน zod (updateRepairStatusSchema) มาแล้ว
  const { status, paymentMethod, chequeBank, chequeNo, chequeDate } = req.body;

  const repair = await prisma.repair.findUnique({
    where: { id: Number(id) },
  });

  if (!repair) {
    createError(404, "ไม่พบงานซ่อม");
  }
  if (repair.status === "CANCELLED") {
    createError(400, CANNOT_EDIT_CANCELLED);
  }

  const data = { status };

  if (status === "COMPLETED") {
    data.completedAt = new Date();
  } else if (status === "CREDIT") {
    // ติดเครดิตไม่ตั้งเวลาชำระเงิน ยอดจะยังไม่เข้ารายงานจนกว่าจะตัดเครดิต
    if (!repair.completedAt) {
      data.completedAt = new Date();
    }
    data.paymentMethod = null;
    data.chequeBank = null;
    data.chequeNo = null;
    data.chequeDate = null;
  } else if (status === "PAID") {
    // แค่แก้วิธีชำระเงินต้องคงเวลาเก็บเงินเดิม ไม่งั้นยอดย้ายไปวันที่มาแก้
    data.paidAt = repair.paidAt ?? new Date();

    if (repair.status === "IN_PROGRESS" && !repair.completedAt) {
      data.completedAt = new Date();
    }

    if (paymentMethod) {
      // เช็ครับเฉพาะบิลเครดิต (กำลังตัดเครดิต หรือเคยเป็นใบส่งของแล้วมาแก้วิธีจ่ายทีหลัง)
      const wasCredit = repair.status === "CREDIT" || !!repair.deliveryNo;
      if (paymentMethod === "CHEQUE" && !wasCredit) {
        createError(400, "รับเช็คได้เฉพาะบิลเครดิต");
      }
      data.paymentMethod = paymentMethod;
      data.chequeBank = paymentMethod === "CHEQUE" ? chequeBank : null;
      data.chequeNo = paymentMethod === "CHEQUE" ? chequeNo : null;
      // คอลัมน์เก็บแค่วันที่ แปลงเป็นเที่ยงคืน UTC วันจะได้ไม่เลื่อนตามเขตเวลา
      data.chequeDate =
        paymentMethod === "CHEQUE" && chequeDate
          ? new Date(`${chequeDate}T00:00:00.000Z`)
          : null;
    }
  }

  // ขยับสต็อกในรายการเดียวกับการเปลี่ยนสถานะ ตัดสต็อกไม่ผ่านสถานะก็ไม่เปลี่ยน
  const toEstimate = status === "ESTIMATE" && repair.status !== "ESTIMATE";
  const fromEstimate = repair.status === "ESTIMATE" && status !== "ESTIMATE";

  if (toEstimate) {
    data.completedAt = null;
    data.paidAt = null;
    data.paymentMethod = null;
    data.chequeBank = null;
    data.chequeNo = null;
    data.chequeDate = null;
  }

  // ใบเสนอราคาเปิดไว้ล่วงหน้าได้นาน วันที่บิลจึงนับใหม่ตอนเริ่มซ่อมจริง
  if (fromEstimate) {
    data.createdAt = new Date();
  }

  await prisma.$transaction(async (tx) => {
    if (toEstimate) await restoreStockForRepair(tx, Number(id));
    if (fromEstimate) await deductStockForRepair(tx, Number(id));

    await tx.repair.update({
      where: { id: Number(id) },
      data,
    });

    if (toEstimate) await releaseReceiptNo(tx, Number(id));
    await assignRepairDocumentNo(tx, Number(id));
  });

  res.json({
    message: "อัปเดตสถานะการซ่อมเรียบร้อยแล้ว",
  });
};

const buildRepairDocument = async (id, body, { forImage = false } = {}) => {
  const repair = await prisma.repair.findUnique({
    where: { id: Number(id) },
    include: {
      customer: true,
      vehicle: {
        include: {
          licensePlate: { select: { plateNumber: true, province: true } },
          vehicleModel: { select: { brand: true, model: true } },
        },
      },
      user: { select: { name: true } },
      repairItems: {
        include: {
          part: {
            select: {
              unit: true,
              name: true,
              // ใบที่ปิดชื่อเต็มต้องรู้ยี่ห้อ ถึงจะตัดยี่ห้อออกจากหน้าชื่อได้
              brand: true,
              // บิลช่วงล่างเรียงตามกลุ่มข้าง บิลเก่าที่ไม่ระบุฝั่งดูจากว่าเป็นของแยกข้างไหม
              attributes: true,
              // อะไหล่ช่วงล่างที่ไม่ได้ระบุรุ่นรถคันนี้อยู่ในรายการซ่อมเพิ่มเติม
              compatibleVehicles: true,
              category: { select: { name: true } },
            },
          },
          service: { select: { name: true, unit: true } },
        },
      },
    },
  });

  if (!repair) {
    createError(404, "ไม่พบงานซ่อม");
  }

  // ค่าเริ่มต้นเท่ากับสวิตช์ในหน้าตัวอย่าง
  const showCustomer = body?.showCustomer === true;
  const showBrand = body?.showBrand === true;
  const isJobSheet = body?.docType === "job";

  const html = isJobSheet
    ? buildJobSheetHtml(repair)
    : buildReceiptHtml(repair, {
        showCustomer,
        showBrand,
        asDelivery: body?.docType === "delivery",
        // รูปส่งให้ลูกค้าทางแชท ไม่ได้บอกมาก็เอาแค่ต้นฉบับ
        copyChoice: body?.copyChoice || (forImage ? "original" : "both"),
      });

  return { repair, html, isJobSheet };
};

exports.printRepairReceipt = async (req, res) => {
  const { repair, html, isJobSheet } = await buildRepairDocument(
    req.params.id,
    req.body,
  );

  await printReceipt(html, repair.id);

  res.json({
    message: isJobSheet
      ? "สั่งพิมพ์ใบสั่งซ่อมแล้ว"
      : req.body?.docType === "delivery"
        ? "สั่งพิมพ์ใบส่งของแล้ว"
        : "สั่งพิมพ์ใบเสร็จแล้ว",
  });
};

exports.renderRepairImages = async (req, res) => {
  const { html } = await buildRepairDocument(req.params.id, req.body, {
    forImage: true,
  });
  const images = await htmlToImages(html);
  res.json({ images });
};
