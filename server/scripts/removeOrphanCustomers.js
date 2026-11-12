// ลบลูกค้าที่ไม่มีบิลและใบวางบิลอ้างถึงแล้ว (ค้างจากการลบบิลหรือย้ายบิลไปรายอื่นก่อนมีการเก็บกวาดอัตโนมัติ)
// ลูกค้าที่มีแต่บิลยกเลิกไม่ลบ เพราะบิลยกเลิกยังอ้างถึงอยู่
//
// ดูก่อนว่าจะลบใคร:  node scripts/removeOrphanCustomers.js
// ลบจริง:           node scripts/removeOrphanCustomers.js --apply
require("dotenv").config({ quiet: true });
const prisma = require("../config/prisma");

const APPLY = process.argv.includes("--apply");

const main = async () => {
  const orphans = await prisma.customer.findMany({
    where: { repairs: { none: {} }, billingNotes: { none: {} } },
    select: { id: true, name: true, phoneNumber: true },
    orderBy: { id: "asc" },
  });

  for (const customer of orphans) {
    console.log(
      `#${customer.id} ${customer.name || "(ไม่มีชื่อ)"}${
        customer.phoneNumber ? ` | ${customer.phoneNumber}` : ""
      }`,
    );
  }

  if (APPLY && orphans.length) {
    await prisma.customer.deleteMany({
      where: {
        id: { in: orphans.map((customer) => customer.id) },
        repairs: { none: {} },
        billingNotes: { none: {} },
      },
    });
  }

  console.log(
    `\n${orphans.length} รายไม่มีบิล ${
      APPLY ? "(ลบแล้ว)" : "(ยังไม่ได้ลบ ใส่ --apply เพื่อลบ)"
    }`,
  );
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
