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
    const { name, price, description, categoryId } = req.body;

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

    const { name, price, description, categoryId } = req.body;

    const service = await prisma.service.findUnique({
      where: { name },
    });

    if (service && service.id !== Number(id)) {
      createError(400, "ชื่อบริการนี้มีอยู่ในระบบแล้ว");
    }

    await prisma.service.update({
      where: { id: Number(id) },
      data: {
        name,
        price,
        description: description || null,
        categoryId,
      },
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
