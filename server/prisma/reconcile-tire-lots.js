// ตรวจ/ซ่อมยางที่ stockQuantity ไม่ตรงกับผลรวมล็อต (drift จากข้อมูลเก่า)
// รันเปล่าๆ = ตรวจอย่างเดียว (read-only) | ใส่ --fix = ซ่อมให้ตรง
//   - stock > ผลรวมล็อต : เพิ่มส่วนต่างเป็นล็อต "ไม่ระบุ" (ไม่ทำสต็อกหาย)
//   - ผลรวมล็อต > stock : ตั้ง stockQuantity = ผลรวมล็อต (เชื่อล็อตที่บันทึกไว้)
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const UNKNOWN_DOT = "ไม่ระบุ";
const shouldFix = process.argv.includes("--fix");

const main = async () => {
  const tires = await prisma.part.findMany({
    where: { category: { name: "ยาง" } },
    select: { id: true, name: true, stockQuantity: true, tireLots: true },
  });

  const mismatched = tires.filter(
    (t) => t.tireLots.reduce((s, l) => s + l.quantity, 0) !== t.stockQuantity,
  );

  if (!mismatched.length) {
    console.log("ทุกยางตรงกันหมด (stockQuantity = ผลรวมล็อต) ✅");
    return;
  }

  console.log(`พบยางไม่ตรง ${mismatched.length} รายการ:\n`);
  for (const tire of mismatched) {
    const sum = tire.tireLots.reduce((s, l) => s + l.quantity, 0);
    const diff = tire.stockQuantity - sum;
    console.log(`- "${tire.name}" (id ${tire.id}): stock=${tire.stockQuantity} ผลรวมล็อต=${sum} (ต่าง ${diff})`);

    if (!shouldFix) continue;

    if (diff > 0) {
      const existing = tire.tireLots.find((l) => l.dotCode === UNKNOWN_DOT);
      if (existing) {
        await prisma.tireLot.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + diff },
        });
      } else {
        await prisma.tireLot.create({
          data: { partId: tire.id, dotCode: UNKNOWN_DOT, quantity: diff },
        });
      }
      console.log(`  → เพิ่มล็อต "${UNKNOWN_DOT}" +${diff}`);
    } else {
      await prisma.part.update({
        where: { id: tire.id },
        data: { stockQuantity: sum },
      });
      console.log(`  → ตั้ง stockQuantity = ${sum}`);
    }
  }

  console.log(shouldFix ? "\nซ่อมเรียบร้อย ✅" : "\n(ตรวจอย่างเดียว — ใส่ --fix เพื่อซ่อม)");
};

main()
  .catch((err) => {
    console.error("ล้มเหลว:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
