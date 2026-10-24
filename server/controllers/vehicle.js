const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.listVehicles = async (req, res) => {
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
        { fleetNo: { contains: search } },
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
};

// ข้อมูลลูกค้าผูกกับบิลรายใบ ไม่ได้ผูกกับรถ จึงหยิบจากบิลล่าสุด
exports.lookupVehicleByPlate = async (req, res) => {
  const { plate, province, excludeRepairId } = req.query;

  if (!plate || !province) {
    return res.json(null);
  }

  // กำลังแก้บิลเดิมอยู่ บิลใบนั้นไม่นับเป็นครั้งที่เคยมา ไม่งั้นรถที่มาครั้งแรกจะขึ้นว่ามาแล้ว 1 ครั้ง
  const excludeId = Number(excludeRepairId) || null;
  // ใบเสนอราคาไม่นับเป็นครั้งที่มา รถยังไม่ได้เข้ามาซ่อมจริง ลูกค้าแค่ถามราคา
  const otherRepairs = {
    status: { notIn: ["ESTIMATE", "CANCELLED"] },
    ...(excludeId ? { id: { not: excludeId } } : {}),
  };

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      licensePlate: { plateNumber: plate, province },
    },
    include: {
      licensePlate: true,
      vehicleModel: true,
      _count: { select: { repairs: { where: otherRepairs } } },
      repairs: {
        where: otherRepairs,
        select: {
          createdAt: true,
          mileage: true,
          customer: {
            select: { name: true, phoneNumber: true, address: true },
          },
          repairItems: {
            select: {
              itemName: true,
              part: { select: { name: true } },
              service: { select: { name: true } },
            },
            orderBy: { id: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  res.json(vehicle || null);
};

exports.getVehicle = async (req, res) => {
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
          customer: { select: { name: true } },
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
};

// ฐานข้อมูลตั้ง onDelete: Restrict ไว้แล้ว แต่กันตรงนี้เพื่อให้ได้ข้อความที่อ่านรู้เรื่อง
exports.deleteVehicle = async (req, res) => {
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
};
