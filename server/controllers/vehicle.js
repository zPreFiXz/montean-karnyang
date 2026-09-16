const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.listVehicles = async (req, res, next) => {
  try {
    const { search } = req.query;

    let filter = {};

    if (search) {
      filter = {
        OR: [
          {
            vehicleModel: {
              OR: [
                { brand: { contains: search } },
                { model: { contains: search } },
              ],
            },
          },
          {
            licensePlate: {
              OR: [
                { plateNumber: { contains: search } },
                { province: { contains: search } },
              ],
            },
          },
          // ค้นจากชื่อ/เบอร์ลูกค้าที่เคยกรอกไว้ในบิลของรถคันนั้น
          // (ข้อมูลลูกค้าผูกกับบิลเป็นรายใบ ไม่ได้ผูกกับตัวรถ จึงต้องไล่ผ่านบิล)
          {
            repairs: {
              some: {
                customer: {
                  OR: [
                    { name: { contains: search } },
                    { phoneNumber: { contains: search } },
                  ],
                },
              },
            },
          },
        ],
      };
    }

    const vehicles = await prisma.vehicle.findMany({
      where: filter,
      include: {
        licensePlate: true,
        vehicleModel: true,
        // ตอนค้นหา ส่งชื่อลูกค้าที่ตรงกับคำค้นไปด้วย เพื่อให้การ์ดบอกได้ว่าทำไมรถคันนี้ถึงขึ้นมา
        ...(search
          ? {
              repairs: {
                where: {
                  customer: {
                    OR: [
                      { name: { contains: search } },
                      { phoneNumber: { contains: search } },
                    ],
                  },
                },
                select: { customer: { select: { name: true } } },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            }
          : {}),
      },
    });

    res.json(vehicles);
  } catch (error) {
    next(error);
  }
};

// ค้นรถจากทะเบียนตอนกำลังกรอกบิล เพื่อบอกว่ารถคันนี้เคยมาแล้ว
// ส่งลูกค้าของบิลล่าสุดไปด้วย หน้ากรอกจะได้เติมชื่อ เบอร์ และที่อยู่ให้ในทีเดียว
// (ข้อมูลลูกค้าผูกกับบิลเป็นรายใบ ไม่ได้ผูกกับตัวรถ จึงต้องหยิบจากบิลล่าสุด)
exports.lookupVehicleByPlate = async (req, res, next) => {
  try {
    const { plate, province } = req.query;

    if (!plate || !province) {
      return res.json(null);
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        licensePlate: { plateNumber: plate, province },
      },
      include: {
        licensePlate: true,
        vehicleModel: true,
        // จำนวนบิลทั้งหมดของรถคันนี้ ใช้บอกว่าเคยมากี่ครั้ง
        _count: { select: { repairs: true } },
        repairs: {
          where: { customerId: { not: null } },
          select: {
            createdAt: true,
            customer: {
              select: { name: true, phoneNumber: true, address: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    res.json(vehicle || null);
  } catch (error) {
    next(error);
  }
};

exports.getVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findFirst({
      where: { id: Number(id) },
      include: {
        licensePlate: {
          select: {
            plateNumber: true,
            province: true,
          },
        },
        vehicleModel: true,
        repairs: {
          select: {
            id: true,
            createdAt: true,
            repairItems: true,
            // ค้นหาด้วยชื่อลูกค้าได้จากหน้ารายการ ต้องบอกได้ด้วยว่าเป็นบิลใบไหน
            customer: { select: { name: true } },
            // ราคากับสถานะ เพื่อให้ตอบได้จากหน้ารายการเลยว่าครั้งก่อนจ่ายเท่าไหร่ และจ่ายครบหรือยัง
            totalPrice: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!vehicle) {
      createError(404, "ไม่พบข้อมูลรถ");
    }

    res.json(vehicle);
  } catch (error) {
    next(error);
  }
};

// ลบรถได้เฉพาะคันที่ไม่มีบิลเหลืออยู่แล้ว (เช่น สร้างบิลผิดทะเบียนแล้วลบบิลทิ้ง)
// ถ้ายังมีบิล ฐานข้อมูลตั้ง onDelete: Restrict ไว้อยู่แล้ว แต่กันตั้งแต่ตรงนี้เพื่อให้ได้ข้อความที่คนอ่านรู้เรื่อง
exports.deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: Number(id) },
      include: { _count: { select: { repairs: true } } },
    });

    if (!vehicle) {
      createError(404, "ไม่พบข้อมูลรถ");
    }

    if (vehicle._count.repairs > 0) {
      createError(400, "ลบไม่ได้ เพราะรถคันนี้ยังมีประวัติการซ่อมอยู่");
    }

    await prisma.$transaction(async (tx) => {
      await tx.vehicle.delete({ where: { id: Number(id) } });

      // ทะเบียนผูกกับรถแบบหนึ่งต่อหนึ่ง ถ้าไม่ลบตามจะค้างเป็นแถวกำพร้าที่กันทะเบียนซ้ำโดยเปล่าประโยชน์
      if (vehicle.licensePlateId) {
        await tx.licensePlate.delete({ where: { id: vehicle.licensePlateId } });
      }
    });

    res.json({ message: "ลบรถเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};
