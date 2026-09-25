const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.listServices = async (req, res, next) => {
  try {
    const services = await prisma.service.findMany();

    res.json(services);
  } catch (error) {
    next(error);
  }
};

exports.createService = async (req, res, next) => {
  try {
    const { name, price, description, unit, categoryId } = req.body;

    const service = await prisma.service.findUnique({
      where: { name },
    });

    if (service) {
      createError(400, "ชื่อบริการนี้มีอยู่ในระบบแล้ว");
    }

    await prisma.service.create({
      data: {
        name,
        price,
        description: description || null,
        unit: unit || null,
        categoryId,
      },
    });

    res.json({ message: "เพิ่มบริการเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { name, price, description, unit, categoryId } = req.body;

    const service = await prisma.service.findUnique({
      where: { name },
    });

    if (service && service.id !== Number(id)) {
      createError(400, "ชื่อบริการนี้มีอยู่ในระบบแล้ว");
    }

    await prisma.$transaction(async (tx) => {
      const before = await tx.service.findUnique({
        where: { id: Number(id) },
        select: { name: true },
      });

      await tx.service.update({
        where: { id: Number(id) },
        data: {
          name,
          price,
          description: description || null,
          unit: unit || null,
          categoryId,
        },
      });

      // ชื่อในบิลเก่าตามชื่อในคลัง แบบเดียวกับอะไหล่ (ดู updatePart)
      // เปลี่ยนเฉพาะบรรทัดที่ยังเป็นชื่อเดิมตรงตัว บรรทัดที่ถูกพิมพ์ชื่อทับในบิลไว้คงไว้ตามที่คนเขียน
      // อยู่ใน transaction เดียวกัน ถ้าเปลี่ยนชื่อในบิลไม่สำเร็จ บริการก็ไม่ถูกแก้ด้วย
      if (before && before.name !== name) {
        await tx.repairItem.updateMany({
          where: { serviceId: Number(id), itemName: before.name },
          data: { itemName: name },
        });
      }
    });

    res.json({ message: "แก้ไขบริการเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};

exports.deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    // บิลเก่าอ้างถึงบริการตัวนี้อยู่ ถ้าลบทิ้งข้อมูลในบิลจะขาดหาย
    // (ความสัมพันธ์ตั้งไว้ให้ตัดเป็นค่าว่าง ไม่ได้ห้ามลบเอง จึงต้องกันที่ตรงนี้)
    const usedInRepair = await prisma.repairItem.findFirst({
      where: { serviceId: Number(id) },
    });

    if (usedInRepair) {
      createError(400, "ลบไม่ได้ เพราะมีงานซ่อมที่ใช้บริการนี้อยู่");
    }

    await prisma.service.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "ลบบริการเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};

// ชื่อที่เคยพิมพ์ทับไว้ในบิลของบริการตัวนี้ (เช่น "อะไหล่อื่นๆ" หรือ "บริการอื่นๆ")
// เอาไว้ให้เลือกซ้ำตอนเปิดบิลใหม่ จะได้ไม่ต้องพิมพ์เองทุกครั้งและชื่อไม่เพี้ยนไปคนละแบบ
exports.listServiceItemNames = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { search } = req.query;

    const service = await prisma.service.findUnique({
      where: { id: Number(id) },
      select: { name: true },
    });

    const items = await prisma.repairItem.findMany({
      where: {
        serviceId: Number(id),
        itemName: { not: null },
        ...(search ? { itemName: { contains: search } } : {}),
      },
      select: { itemName: true },
      distinct: ["itemName"],
      orderBy: { id: "desc" },
      take: 20,
    });

    // ชื่อที่ยังเป็นชื่อบริการตั้งต้นไม่ใช่ชื่อที่พิมพ์เอง ไม่ต้องเอามาเสนอ
    const names = items
      .map((item) => item.itemName)
      .filter((name) => name && name !== service?.name);

    res.json(names);
  } catch (error) {
    next(error);
  }
};
