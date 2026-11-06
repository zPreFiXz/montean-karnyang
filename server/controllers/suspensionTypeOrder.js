const prisma = require("../config/prisma");
const createError = require("../utils/createError");

const GROUPS = ["side", "other"];

exports.getSuspensionTypeOrder = async (req, res) => {
  const rows = await prisma.suspensionTypeOrder.findMany({
    orderBy: { sortOrder: "asc" },
  });
  res.json(
    Object.fromEntries(
      GROUPS.map((group) => [
        group,
        rows.filter((row) => row.group === group).map((row) => row.type),
      ]),
    ),
  );
};

// ส่งลำดับทั้งกลุ่มมาแทนของเดิม ชนิดที่หายไปจากคลังแล้วก็หลุดออกจากตารางไปเอง
exports.updateSuspensionTypeOrder = async (req, res) => {
  const { group, types } = req.body || {};
  if (!GROUPS.includes(group) || !Array.isArray(types)) {
    createError(400, "ข้อมูลลำดับไม่ถูกต้อง");
  }
  const clean = [
    ...new Set(
      types
        .map((type) =>
          String(type || "")
            .trim()
            .slice(0, 100),
        )
        .filter(Boolean),
    ),
  ];

  await prisma.$transaction([
    prisma.suspensionTypeOrder.deleteMany({ where: { group } }),
    prisma.suspensionTypeOrder.createMany({
      data: clean.map((type, index) => ({ group, type, sortOrder: index + 1 })),
    }),
  ]);

  res.json({ message: "บันทึกลำดับเรียบร้อยแล้ว" });
};
