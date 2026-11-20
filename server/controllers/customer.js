const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const { buildOrganizationBillHtml } = require("../utils/receiptHtml");
const { printReceipt } = require("../utils/printReceipt");
const { peekBillingNo, issueBillingNo } = require("../utils/documentNumber");
const { buildPartItemName } = require("../utils/repairItemName");

// กันชื่อเดียวกันถูกพิมพ์ต่างกันจนกลายเป็นคนละราย (ระบบจับคู่ด้วยชื่อเมื่อไม่มีเบอร์ ดู utils/repairCustomer.js)
exports.listCustomers = async (req, res) => {
  const { search } = req.query;

  const customers = await prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { phoneNumber: { contains: search } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      address: true,
      taxId: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  res.json(customers);
};

// บิลยกเลิกไม่นับ ลูกค้าที่มีแต่บิลยกเลิกจึงไม่ขึ้นในรายชื่อ
const NOT_CANCELLED = { status: { not: "CANCELLED" } };

exports.listCustomerDirectory = async (req, res) => {
  const customers = await prisma.customer.findMany({
    where: { repairs: { some: NOT_CANCELLED } },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      organizationType: true,
      repairs: {
        where: NOT_CANCELLED,
        select: { vehicleId: true },
      },
    },
  });

  res.json(
    customers.map(({ repairs, ...customer }) => ({
      ...customer,
      vehicleCount: new Set(repairs.map((r) => r.vehicleId).filter(Boolean))
        .size,
    })),
  );
};

exports.getCustomer = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) createError(400, "ไม่พบลูกค้า");

  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      address: true,
      taxId: true,
      organizationType: true,
      repairs: {
        where: { ...NOT_CANCELLED, vehicleId: { not: null } },
        select: {
          createdAt: true,
          vehicle: {
            select: {
              id: true,
              licensePlate: { select: { plateNumber: true, province: true } },
              vehicleModel: { select: { brand: true, model: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!customer) createError(404, "ไม่พบลูกค้า");

  // บิลเรียงจากล่าสุดลงไป รถจึงเรียงจากคันที่มาล่าสุด
  const vehicles = new Map();
  for (const repair of customer.repairs) {
    if (!vehicles.has(repair.vehicle.id)) {
      vehicles.set(repair.vehicle.id, repair.vehicle);
    }
  }

  // ขายอะไหล่และงานบริการที่ไม่ผูกรถ ใบเสนอราคายังไม่ได้ซื้อจริงจึงไม่นับ
  const bills = await prisma.repair.findMany({
    where: {
      customerId: id,
      vehicleId: null,
      status: { notIn: ["ESTIMATE", "CANCELLED"] },
    },
    select: {
      id: true,
      type: true,
      status: true,
      totalPrice: true,
      createdAt: true,
      repairItems: { select: { itemName: true, partId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  delete customer.repairs;
  res.json({ ...customer, vehicles: [...vehicles.values()], bills });
};

const ORGANIZATION_TYPES = ["GOVERNMENT", "SHOP"];

exports.updateCustomerOrganizationType = async (req, res) => {
  const { id } = req.params;
  const { organizationType } = req.body;

  if (organizationType && !ORGANIZATION_TYPES.includes(organizationType)) {
    createError(400, "ประเภทลูกค้าไม่ถูกต้อง");
  }

  const customer = await prisma.customer.update({
    where: { id: Number(id) },
    data: { organizationType: organizationType || null },
    select: { id: true, name: true, organizationType: true },
  });

  res.json(customer);
};

// ยอดค้าง = บิลที่สถานะเป็นเครดิต
exports.listOrganizations = async (req, res) => {
  const { search } = req.query;

  const customers = await prisma.customer.findMany({
    where: {
      organizationType: { not: null },
      ...(search ? { name: { contains: search } } : {}),
    },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      address: true,
      taxId: true,
      organizationType: true,
      repairs: {
        where: { status: "CREDIT" },
        select: { totalPrice: true, createdAt: true },
      },
    },
  });

  const organizations = customers
    .map(({ repairs, ...customer }) => ({
      ...customer,
      creditCount: repairs.length,
      creditTotal: repairs.reduce(
        (sum, repair) => sum + Number(repair.totalPrice || 0),
        0,
      ),
      oldestUnpaidAt: repairs.reduce(
        (oldest, repair) =>
          !oldest || repair.createdAt < oldest ? repair.createdAt : oldest,
        null,
      ),
    }))
    .sort(
      (a, b) =>
        b.creditTotal - a.creditTotal ||
        String(a.name || "").localeCompare(String(b.name || ""), "th"),
    );

  res.json(organizations);
};

// ใบเสนอราคาไม่นับเป็นประวัติ เพราะยังไม่ได้ซ่อมและไม่มีรายได้
exports.listOrganizationRepairs = async (req, res) => {
  const { id } = req.params;
  const { scope } = req.query;

  const customer = await prisma.customer.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      address: true,
      taxId: true,
      organizationType: true,
    },
  });

  if (!customer) {
    createError(404, "ไม่พบลูกค้า");
  }

  const repairs = await prisma.repair.findMany({
    where: {
      customerId: Number(id),
      ...(scope === "all"
        ? { status: { notIn: ["ESTIMATE", "CANCELLED"] } }
        : { status: "CREDIT" }),
    },
    include: {
      // การ์ดของบิลที่ไม่ผูกกับรถใช้ชื่อลูกค้าเป็นบรรทัดล่าง ไม่ส่งไปจะกลายเป็น "ลูกค้าทั่วไป"
      customer: { select: { name: true, organizationType: true } },
      vehicle: {
        include: {
          licensePlate: { select: { plateNumber: true, province: true } },
          vehicleModel: { select: { brand: true, model: true } },
        },
      },
      repairItems: {
        include: {
          part: {
            select: {
              unit: true,
              name: true,
              category: { select: { name: true } },
            },
          },
          service: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // ร้านค้าเราไปรับอะไหล่จากเขาด้วย ส่งรายการที่ยังไม่หักกลบมาคู่กับบิลเครดิต
  const purchases =
    customer.organizationType === "SHOP"
      ? await findOpenPurchases(customer.id)
      : [];

  res.json({ customer, repairs, purchases });
};

// อะไหล่ที่รับจากร้านค้าที่ยังไม่หักกลบ เก่าสุดก่อนแบบเดียวกับบิล
// month (2026-09) = เฉพาะที่รับในเดือนนั้น
const findOpenPurchases = (customerId, monthRange = null) =>
  prisma.shopPurchase.findMany({
    where: {
      customerId,
      settledAt: null,
      ...(monthRange ? { takenAt: monthRange } : {}),
    },
    orderBy: [{ takenAt: "asc" }, { id: "asc" }],
  });

const findShop = async (id) => {
  const customer = await prisma.customer.findUnique({
    where: { id: Number(id) },
    select: { id: true, organizationType: true },
  });
  if (!customer) createError(404, "ไม่พบลูกค้า");
  // หน่วยงานราชการเราไม่ได้ไปรับของ มีเฉพาะร้านค้า
  if (customer.organizationType !== "SHOP") {
    createError(400, "บันทึกอะไหล่ที่รับมาได้เฉพาะร้านค้า");
  }
  return customer;
};

// ยางใหม่นับสต็อกตามล็อต DOT (ต้องตรงกับ tracksTireLots ฝั่งหน้าเว็บ)
const tracksTireLots = (part) => part.category?.name === "ยาง";

exports.createShopPurchase = async (req, res) => {
  const shop = await findShop(req.params.id);
  const { partId, takenAt, quantity, dotCode, unitPrice } = req.body;

  // อะไหล่อื่นๆ พิมพ์ชื่อเอง ไม่มีในคลัง บันทึกไว้หักกลบอย่างเดียว ไม่แตะสต็อก
  if (!partId) {
    await prisma.shopPurchase.create({
      data: {
        customerId: shop.id,
        takenAt: new Date(`${takenAt}T00:00:00.000Z`),
        itemName: req.body.itemName,
        quantity,
        unit: req.body.unit || null,
        unitPrice,
      },
    });
    return res.json({ message: "เพิ่มอะไหล่ที่รับมาเรียบร้อยแล้ว" });
  }

  const part = await prisma.part.findUnique({
    where: { id: partId },
    include: { category: true },
  });
  if (!part) createError(404, "ไม่พบอะไหล่");
  // ชุดน้ำมันนับสต็อกจากขวดน้ำมัน รับเข้าที่ตัวชุดไม่ได้
  if (part.oilSourceId) {
    createError(400, "ชุดน้ำมันรับเข้าไม่ได้ กรุณาเลือกขวดน้ำมันแทน");
  }
  const isLot = tracksTireLots(part);
  if (isLot && !dotCode) createError(400, "กรุณากรอกสัปดาห์/ปีผลิต");
  if (isLot && !Number.isInteger(quantity)) {
    createError(400, "จำนวนต้องเป็นจำนวนเต็ม");
  }

  // รับของเข้าร้านจริง บวกสต็อกพร้อมบันทึกรายการในคราวเดียว
  await prisma.$transaction(async (tx) => {
    await tx.part.update({
      where: { id: part.id },
      data: { stockQuantity: { increment: quantity } },
    });
    if (isLot) {
      const lot = await tx.tireLot.findFirst({
        where: { partId: part.id, dotCode },
      });
      if (lot) {
        await tx.tireLot.update({
          where: { id: lot.id },
          data: { quantity: lot.quantity + quantity },
        });
      } else {
        await tx.tireLot.create({
          data: { partId: part.id, dotCode, quantity },
        });
      }
    }
    await tx.shopPurchase.create({
      data: {
        customerId: shop.id,
        partId: part.id,
        takenAt: new Date(`${takenAt}T00:00:00.000Z`),
        // ชื่อตอนรับ ลบอะไหล่ออกจากคลังทีหลังใบวางบิลยังอ่านได้
        itemName: buildPartItemName(part),
        quantity,
        unit: part.unit || null,
        dotCode: isLot ? dotCode : null,
        unitPrice,
      },
    });
  });

  res.json({ message: "เพิ่มอะไหล่ที่รับมาเรียบร้อยแล้ว" });
};

const findOpenPurchase = async (customerId, id) => {
  const purchase = await prisma.shopPurchase.findUnique({
    where: { id: Number(id) || 0 },
  });
  if (!purchase || purchase.customerId !== Number(customerId)) {
    createError(404, "ไม่พบรายการ");
  }
  // หักกลบแล้วคือปิดบัญชีกับร้านไปแล้ว แก้หรือลบจะทำให้ยอดที่ตกลงกันไม่ตรง
  if (purchase.settledAt) createError(400, "รายการนี้หักกลบแล้ว แก้ไขไม่ได้");
  return purchase;
};

// แก้ได้แค่วันที่กับราคา ชนิดกับจำนวนผูกกับสต็อกที่รับเข้าไปแล้ว
exports.updateShopPurchase = async (req, res) => {
  const purchase = await findOpenPurchase(req.params.id, req.params.purchaseId);
  await prisma.shopPurchase.update({
    where: { id: purchase.id },
    data: {
      takenAt: new Date(`${req.body.takenAt}T00:00:00.000Z`),
      unitPrice: req.body.unitPrice,
      // ชื่อของอะไหล่จากสต็อกเป็นชื่อในคลังตอนรับ แก้ได้เฉพาะอะไหล่อื่นๆ
      ...(!purchase.partId && req.body.itemName
        ? { itemName: req.body.itemName, unit: req.body.unit || null }
        : {}),
    },
  });
  res.json({ message: "แก้ไขอะไหล่ที่รับมาเรียบร้อยแล้ว" });
};

// บันทึกผิดแล้วลบ หักของที่รับเข้าไปออกจากสต็อกคืน ขายไปแล้วหักคืนไม่ได้ จึงห้ามลบ
exports.deleteShopPurchase = async (req, res) => {
  const purchase = await findOpenPurchase(req.params.id, req.params.purchaseId);
  const quantity = Number(purchase.quantity);

  await prisma.$transaction(async (tx) => {
    const part = purchase.partId
      ? await tx.part.findUnique({ where: { id: purchase.partId } })
      : null;
    if (part) {
      if (Number(part.stockQuantity) < quantity) {
        createError(
          400,
          "ลบไม่ได้ เพราะอะไหล่นี้ขายออกไปแล้ว สต็อกเหลือไม่พอให้หักคืน",
        );
      }
      await tx.part.update({
        where: { id: part.id },
        data: { stockQuantity: { decrement: quantity } },
      });
      if (purchase.dotCode) {
        const lot = await tx.tireLot.findFirst({
          where: { partId: part.id, dotCode: purchase.dotCode },
        });
        if (lot) {
          const left = lot.quantity - quantity;
          await (left > 0
            ? tx.tireLot.update({
                where: { id: lot.id },
                data: { quantity: left },
              })
            : tx.tireLot.delete({ where: { id: lot.id } }));
        }
      }
    }
    await tx.shopPurchase.delete({ where: { id: purchase.id } });
  });
  res.json({ message: "ลบอะไหล่ที่รับมาเรียบร้อยแล้ว" });
};

// หักกลบเฉพาะรายการที่หน้าจอส่งมา รายการที่เพิ่งเพิ่มระหว่างนั้นจะไม่ถูกปิดไปโดยไม่ได้เห็น
exports.settleShopPurchases = async (req, res) => {
  const shop = await findShop(req.params.id);
  const result = await prisma.shopPurchase.updateMany({
    where: { id: { in: req.body.ids }, customerId: shop.id, settledAt: null },
    data: { settledAt: new Date() },
  });
  res.json({
    message: "หักกลบเรียบร้อยแล้ว",
    count: result.count,
  });
};

// ใช้ร่วมกันระหว่างหน้าตัวอย่างกับตอนพิมพ์ ชุดบิลจะได้ตรงกัน
const findBillRepairs = async (id, month) => {
  // ใบวางบิลคือเอกสารเรียกเก็บเงิน มีเฉพาะบิลเครดิตที่ยังไม่จ่ายเสมอ
  // month (2026-09) = เฉพาะของเดือนนั้น ไม่ส่ง = ทุกเดือน
  const monthKey = String(month || "");
  const isMonthly = /^\d{4}-\d{2}$/.test(monthKey);

  const customer = await prisma.customer.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      name: true,
      organizationType: true,
      phoneNumber: true,
      address: true,
      taxId: true,
    },
  });

  if (!customer) {
    createError(404, "ไม่พบลูกค้า");
  }

  // ขอบเขตของเดือนคิดจากเวลาท้องถิ่นของเครื่องที่รันระบบ ให้ตรงกับที่หน้าเว็บจัดกลุ่มไว้
  const monthRange = isMonthly
    ? {
        gte: new Date(
          Number(monthKey.slice(0, 4)),
          Number(monthKey.slice(5)) - 1,
        ),
        lt: new Date(Number(monthKey.slice(0, 4)), Number(monthKey.slice(5))),
      }
    : null;

  const repairs = await prisma.repair.findMany({
    where: {
      customerId: Number(id),
      status: "CREDIT",
      ...(isMonthly ? { createdAt: monthRange } : {}),
    },
    select: {
      id: true,
      type: true,
      receiptNo: true,
      deliveryNo: true,
      totalPrice: true,
      createdAt: true,
      // วันที่ในใบวางบิลเป็นวันที่ส่งมอบ ตรงกับวันที่บนใบส่งของ
      completedAt: true,
      status: true,
      vehicle: {
        select: {
          fleetNo: true,
          licensePlate: { select: { plateNumber: true, province: true } },
          vehicleModel: { select: { brand: true, model: true } },
        },
      },
    },
    orderBy: { id: "asc" },
  });
  // เรียงตามเลขใบส่งของ (ต้องตรงกับ byDeliveryNo ฝั่งหน้าเว็บ)
  repairs.sort(
    (a, b) =>
      (!a.deliveryNo !== !b.deliveryNo
        ? a.deliveryNo
          ? -1
          : 1
        : String(a.deliveryNo || "").localeCompare(
            String(b.deliveryNo || ""),
          )) || a.id - b.id,
  );

  const purchases =
    customer.organizationType === "SHOP"
      ? await findOpenPurchases(customer.id, monthRange)
      : [];

  if (repairs.length === 0 && purchases.length === 0) {
    createError(400, "ไม่มีบิลเครดิตให้พิมพ์");
  }

  return { customer, repairs, purchases };
};

// อะไหล่ที่รับมาเป็นส่วนหนึ่งของชุด เพิ่มหรือลบรายการแล้วต้องได้ใบวางบิลเลขใหม่
// ใช้เลขติดลบแทนรายการ ไม่ชนกับเลขบิล ชุดที่ไม่มีอะไหล่ได้กุญแจเดิมเหมือนก่อนมีฟีเจอร์นี้
const billingIdsOf = (repairs, purchases) => [
  ...repairs.map((repair) => repair.id),
  ...purchases.map((purchase) => -purchase.id),
];

// เลขใบวางบิลที่จะได้ถ้าพิมพ์ตอนนี้ ชุดบิลที่เคยพิมพ์แล้วได้เลขเดิม ชุดใหม่แสดงเลขถัดไปโดยยังไม่จอง
exports.peekOrganizationBillNo = async (req, res) => {
  const { customer, repairs, purchases } = await findBillRepairs(
    req.params.id,
    req.query.month,
  );
  const number = await peekBillingNo(
    prisma,
    customer.id,
    billingIdsOf(repairs, purchases),
  );
  res.json({ number });
};

exports.printOrganizationBill = async (req, res) => {
  const { customer, repairs, purchases } = await findBillRepairs(
    req.params.id,
    req.body?.month,
  );
  const billingNo = await issueBillingNo(
    prisma,
    customer.id,
    billingIdsOf(repairs, purchases),
  );
  const html = buildOrganizationBillHtml(
    customer,
    repairs,
    billingNo,
    purchases,
  );

  await printReceipt(html, `org-${customer.id}`);

  res.json({ message: "สั่งพิมพ์ใบวางบิลแล้ว" });
};
