// Backfill ล็อตยางให้ของเก่า: ยางที่มีอยู่ก่อนระบบล็อต ยังไม่มี TireLot
// สร้างล็อตเริ่มต้น 1 ล็อต (จำนวน = stockQuantity, DOT = "ไม่ระบุ")
// รันครั้งเดียวหลัง migrate deploy — idempotent: ยางที่มีล็อตแล้วจะถูกข้าม
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const UNKNOWN_DOT = "ไม่ระบุ";

const main = async () => {
  const tires = await prisma.part.findMany({
    where: {
      category: { name: "ยาง" },
      tireLots: { none: {} }, // ยังไม่มีล็อต = ยังไม่ backfill
    },
    select: { id: true, name: true, stockQuantity: true },
  });

  if (!tires.length) {
    console.log("ไม่มียางที่ต้อง backfill (ทุกตัวมีล็อตแล้ว)");
    return;
  }

  let created = 0;
  for (const tire of tires) {
    // ยางที่สต็อก 0 ก็สร้างล็อตว่าง (quantity 0) ไว้ให้ผลรวมตรง
    await prisma.tireLot.create({
      data: {
        partId: tire.id,
        dotCode: UNKNOWN_DOT,
        quantity: Math.max(0, tire.stockQuantity ?? 0),
      },
    });
    created += 1;
    console.log(`+ ล็อต "${tire.name}" จำนวน ${tire.stockQuantity} (DOT: ${UNKNOWN_DOT})`);
  }

  console.log(`\nสร้างล็อตให้ยางเก่า ${created} รายการ`);
};

main()
  .catch((err) => {
    console.error("Backfill ล้มเหลว:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
