const prisma = require("../config/prisma");
const createError = require("../utils/createError");

// ค้นลูกค้าที่เคยบันทึกไว้ เพื่อให้เลือกซ้ำได้ตอนกรอกบิล
// สำคัญกว่าความสะดวก: กันชื่อเดียวกันถูกพิมพ์ต่างกันจนกลายเป็นลูกค้าคนละราย
// (ระบบจับคู่ด้วยชื่อเมื่อไม่มีเบอร์โทร ดู resolveCustomer ใน controllers/repair.js)
exports.listCustomers = async (req, res, next) => {
  try {
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
      select: { id: true, name: true, phoneNumber: true, address: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    res.json(customers);
  } catch (error) {
    next(error);
  }
};

const ORGANIZATION_TYPES = ["GOVERNMENT", "SHOP"];

// ตั้งว่าลูกค้ารายนี้เป็นหน่วยงานราชการหรือร้านค้า ส่งค่าว่างมาคือกลับเป็นลูกค้าทั่วไป
exports.updateCustomerOrganizationType = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

// รายชื่อหน่วยงานและร้านค้า พร้อมยอดที่ยังค้างชำระอยู่
// ยอดค้าง = บิลที่สถานะเป็นเครดิต ยังไม่ได้เก็บเงิน
exports.listOrganizations = async (req, res, next) => {
  try {
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
        organizationType: true,
        repairs: {
          where: { status: "CREDIT" },
          select: { totalPrice: true },
        },
      },
    });

    // รวมยอดฝั่งนี้เลย หน้าเว็บจะได้ไม่ต้องดึงบิลทั้งหมดไปบวกเอง
    const organizations = customers
      .map(({ repairs, ...customer }) => ({
        ...customer,
        creditCount: repairs.length,
        creditTotal: repairs.reduce(
          (sum, repair) => sum + Number(repair.totalPrice || 0),
          0,
        ),
      }))
      // ค้างเยอะขึ้นก่อน เพราะเป็นเหตุผลหลักที่เปิดหน้านี้
      .sort(
        (a, b) =>
          b.creditTotal - a.creditTotal ||
          String(a.name || "").localeCompare(String(b.name || ""), "th"),
      );

    res.json(organizations);
  } catch (error) {
    next(error);
  }
};

// บิลของหน่วยงานหรือร้านค้ารายนี้
// ปกติเอาเฉพาะที่ยังค้างชำระ ส่ง scope=all มาเมื่อต้องการดูประวัติย้อนหลังทั้งหมด
// ใบประเมินราคาไม่นับเป็นประวัติ เพราะยังไม่ได้ลงมือซ่อมและไม่ได้เกิดรายได้
exports.listOrganizationRepairs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { scope } = req.query;

    const customer = await prisma.customer.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        address: true,
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
          ? { status: { not: "ESTIMATE" } }
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
        repairItems: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ customer, repairs });
  } catch (error) {
    next(error);
  }
};
