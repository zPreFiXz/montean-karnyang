const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const { buildOrganizationBillHtml } = require("../utils/receiptHtml");
const { printReceipt } = require("../utils/printReceipt");

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
          // วันที่ไว้บอกว่าค้างมาตั้งแต่เดือนไหน
          select: { totalPrice: true, createdAt: true },
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
        // บิลที่ยังไม่ได้เก็บเงินและเก่าที่สุด = ค้างมาตั้งแต่เดือนไหน
        oldestUnpaidAt: repairs.reduce(
          (oldest, repair) =>
            !oldest || repair.createdAt < oldest ? repair.createdAt : oldest,
          null,
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
        // รายละเอียดครบ เพราะหน้านี้เอาไปวาดตัวอย่างใบเสร็จด้วย ไม่ใช่แค่นับจำนวน
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
  } catch (error) {
    next(error);
  }
};

// พิมพ์ใบวางบิลของหน่วยงานหรือร้านค้า: แผ่นแรกเป็นใบสรุปยอดค้าง แผ่นถัดไปเป็นใบเสร็จของแต่ละบิล
exports.printOrganizationBill = async (req, res, next) => {
  try {
    const { id } = req.params;
    // ส่งเดือนมาในรูป 2026-09 = เอาบิลของเดือนนั้นทุกสถานะ (ใช้กับหน้าประวัติรายเดือน)
    // ไม่ส่งมา = เอาเฉพาะบิลที่ยังค้างชำระ
    const month = String(req.body?.month || "");
    const isMonthly = /^\d{4}-\d{2}$/.test(month);

    const customer = await prisma.customer.findUnique({
      where: { id: Number(id) },
      select: { id: true, name: true, organizationType: true },
    });

    if (!customer) {
      createError(404, "ไม่พบลูกค้า");
    }

    // ขอบเขตของเดือนคิดจากเวลาท้องถิ่นของเครื่องที่รันระบบ ให้ตรงกับที่หน้าเว็บจัดกลุ่มไว้
    const monthRange = isMonthly
      ? {
          gte: new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1),
          lt: new Date(Number(month.slice(0, 4)), Number(month.slice(5))),
        }
      : null;

    const repairs = await prisma.repair.findMany({
      where: {
        customerId: Number(id),
        ...(isMonthly
          ? { status: { not: "ESTIMATE" }, createdAt: monthRange }
          : { status: "CREDIT" }),
      },
      // ใบวางบิลใช้แค่หัวบิล ไม่ต้องดึงรายการในบิลมาทั้งหมด
      select: {
        id: true,
        type: true,
        totalPrice: true,
        createdAt: true,
        vehicle: {
          select: {
            licensePlate: { select: { plateNumber: true, province: true } },
            vehicleModel: { select: { brand: true, model: true } },
          },
        },
      },
      // เรียงตามเลขที่ใบเสร็จจากน้อยไปมาก
      orderBy: { id: "asc" },
    });

    if (repairs.length === 0) {
      createError(
        400,
        isMonthly ? "ไม่มีบิลให้พิมพ์" : "ไม่มีบิลค้างชำระให้พิมพ์",
      );
    }

    const html = buildOrganizationBillHtml(customer, repairs);

    await printReceipt(html, `org-${customer.id}`);

    res.json({ message: "ส่งใบวางบิลเข้าเครื่องพิมพ์แล้ว" });
  } catch (error) {
    next(error);
  }
};
