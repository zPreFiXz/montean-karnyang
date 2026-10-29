const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const { buildOrganizationBillHtml } = require("../utils/receiptHtml");
const { printReceipt } = require("../utils/printReceipt");
const { peekBillingNo, issueBillingNo } = require("../utils/documentNumber");

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

// ใบประเมินราคาไม่นับเป็นประวัติ เพราะยังไม่ได้ซ่อมและไม่มีรายได้
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

  res.json({ customer, repairs });
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

  if (repairs.length === 0) {
    createError(400, "ไม่มีบิลเครดิตให้พิมพ์");
  }

  return { customer, repairs };
};

// เลขใบวางบิลที่จะได้ถ้าพิมพ์ตอนนี้ ชุดบิลที่เคยพิมพ์แล้วได้เลขเดิม ชุดใหม่แสดงเลขถัดไปโดยยังไม่จอง
exports.peekOrganizationBillNo = async (req, res) => {
  const { customer, repairs } = await findBillRepairs(
    req.params.id,
    req.query.month,
  );
  const number = await peekBillingNo(
    prisma,
    customer.id,
    repairs.map((repair) => repair.id),
  );
  res.json({ number });
};

exports.printOrganizationBill = async (req, res) => {
  const { customer, repairs } = await findBillRepairs(
    req.params.id,
    req.body?.month,
  );
  const billingNo = await issueBillingNo(
    prisma,
    customer.id,
    repairs.map((repair) => repair.id),
  );
  const html = buildOrganizationBillHtml(customer, repairs, billingNo);

  await printReceipt(html, `org-${customer.id}`);

  res.json({ message: "ส่งใบวางบิลเข้าเครื่องพิมพ์แล้ว" });
};
