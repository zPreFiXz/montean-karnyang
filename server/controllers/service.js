const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.listServices = async (req, res) => {
  const services = await prisma.service.findMany();

  res.json(services);
};

exports.createService = async (req, res) => {
  const { name, price, description, unit, perSide, image, categoryId } =
    req.body;

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
      perSide: !!perSide,
      publicId: image?.publicId || null,
      secureUrl: image?.secureUrl || null,
      categoryId,
    },
  });

  res.json({ message: "เพิ่มบริการเรียบร้อยแล้ว" });
};

exports.updateService = async (req, res) => {
  const { id } = req.params;

  const { name, price, description, unit, perSide, image, categoryId } =
    req.body;

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
        perSide: !!perSide,
        // ไม่ส่งรูปมา = ไม่แตะรูปเดิม ส่งค่าว่างมา = ลบรูป (เหมือน updatePart)
        ...(image !== undefined
          ? {
              publicId: image?.publicId || null,
              secureUrl: image?.secureUrl || null,
            }
          : {}),
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
};

exports.deleteService = async (req, res) => {
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
};
