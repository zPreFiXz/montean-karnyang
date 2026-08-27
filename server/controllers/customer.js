const prisma = require("../config/prisma");

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
