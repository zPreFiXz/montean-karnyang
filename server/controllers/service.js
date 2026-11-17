const prisma = require("../config/prisma");
const { destroyImageQuietly } = require("../utils/cloudinaryImage");
const createError = require("../utils/createError");

exports.listServices = async (req, res) => {
  const services = await prisma.service.findMany();

  res.json(services);
};

// ส่งรหัสบริการทั้งหมดในหมวดตามลำดับใหม่ บริการที่ไม่ได้ส่งมาคงลำดับเดิม
exports.updateServiceOrder = async (req, res) => {
  const { ids } = req.body;

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.service.updateMany({
        where: { id },
        data: { sortOrder: index + 1 },
      }),
    ),
  );

  res.json({ message: "บันทึกลำดับเรียบร้อยแล้ว" });
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

  const created = await prisma.service.create({
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

  res.json({
    message: "เพิ่มบริการเรียบร้อยแล้ว",
    id: created.id,
    type: "service",
  });
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

  let replacedPublicId = null;

  await prisma.$transaction(async (tx) => {
    const before = await tx.service.findUnique({
      where: { id: Number(id) },
      select: { name: true, publicId: true },
    });
    const nextPublicId =
      image !== undefined ? image?.publicId || null : undefined;
    if (
      nextPublicId !== undefined &&
      before?.publicId &&
      before.publicId !== nextPublicId
    ) {
      replacedPublicId = before.publicId;
    }

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

    // ชื่อในบิลตามชื่อในคลัง เปลี่ยนเฉพาะบรรทัดที่ยังเป็นชื่อเดิมตรงตัว (ดู updatePart)
    if (before && before.name !== name) {
      await tx.repairItem.updateMany({
        where: { serviceId: Number(id), itemName: before.name },
        data: { itemName: name },
      });
    }
  });

  await destroyImageQuietly(replacedPublicId);

  res.json({ message: "แก้ไขบริการเรียบร้อยแล้ว" });
};

exports.deleteService = async (req, res) => {
  const { id } = req.params;

  // ความสัมพันธ์ตั้งไว้ให้ตัดเป็นค่าว่าง ไม่ได้ห้ามลบ จึงต้องกันตรงนี้ ไม่งั้นข้อมูลในบิลเก่าจะขาด
  const usedInRepair = await prisma.repairItem.findFirst({
    where: { serviceId: Number(id) },
  });

  if (usedInRepair) {
    createError(400, "ลบไม่ได้ เพราะมีงานซ่อมที่ใช้บริการนี้อยู่");
  }

  const deleted = await prisma.service.delete({
    where: { id: Number(id) },
    select: { publicId: true },
  });
  await destroyImageQuietly(deleted.publicId);

  res.json({ message: "ลบบริการเรียบร้อยแล้ว" });
};
