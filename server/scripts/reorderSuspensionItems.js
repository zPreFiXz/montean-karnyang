// เรียงรายการในแท็บของบิลเช็กช่วงล่างเก่าให้เหมือนบิลใหม่ (ดู buildTabItems ใน client/src/hooks/useSuspensionTabs.js)
// ซ้าย ขวา อื่นๆ แต่ละข้างเรียงตามหัวข้อในตาราง SuspensionTypeOrder ตั้งลูกปืนล้อท้ายสุด
// สลับแค่ตำแหน่งในบิลเดียวกัน ราคา จำนวน สต็อกไม่เปลี่ยน รายการซ่อมเพิ่มเติม (ไม่มีข้าง) ไม่แตะ
//
// ดูก่อนว่าจะเปลี่ยนอะไร:  node scripts/reorderSuspensionItems.js
// บันทึกจริง:             node scripts/reorderSuspensionItems.js --apply
require("dotenv").config({ quiet: true });
const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");

const APPLY = process.argv.includes("--apply");
const PER_SIDE_SERVICE_NAME = "ตั้งลูกปืนล้อ";
const SIDE_RANK = { LEFT: 0, RIGHT: 1, OTHER: 2 };

// ใช้เมื่อยังไม่ได้รัน migration ของตาราง SuspensionTypeOrder (ตรงกับค่าที่ migration ใส่ไว้)
const DEFAULT_ORDER = {
  side: [
    "ลูกหมากปีกนกบน",
    "สลักปีกนกบน",
    "ลูกหมากปีกนกล่าง",
    "ลูกหมากแร็ค",
    "ยางกันฝุ่นแร็ค",
    "คันชักนอก",
    "คันชักนอก-ใน",
    "บูชปีกนกบน",
    "บูชปีกนกล่าง",
    "บูชปีกนกล่าง(เล็ก)",
    "บูชปีกนกล่าง(ใหญ่)",
    "สลักปีกนกล่าง",
    "ลูกหมากกันโคลงหน้า",
    "สกรูกันโคลง",
    "ยางกันโคลง",
  ],
  other: ["คันส่งกลาง", "โช้คหน้า", "โช้คหลัง"],
};

const collator = new Intl.Collator("th", { numeric: true });
const typeOf = (item) =>
  String(item.part?.name || item.itemName || "")
    .trim()
    .split(/\s+/)[0];
const compareTypes = (order) => (a, b) => {
  const rank = (type) => {
    const index = order.indexOf(type);
    return index === -1 ? order.length : index;
  };
  const ta = typeOf(a);
  const tb = typeOf(b);
  return rank(ta) - rank(tb) || collator.compare(ta, tb);
};
const isPerSideService = (item) =>
  (item.service?.name || item.itemName) === PER_SIDE_SERVICE_NAME;

const loadOrder = async () => {
  try {
    const rows = await prisma.suspensionTypeOrder.findMany({
      orderBy: { sortOrder: "asc" },
    });
    const of = (group) =>
      rows.filter((row) => row.group === group).map((row) => row.type);
    return {
      side: of("side").length ? of("side") : DEFAULT_ORDER.side,
      other: of("other").length ? of("other") : DEFAULT_ORDER.other,
    };
  } catch {
    return DEFAULT_ORDER;
  }
};

const main = async () => {
  const order = await loadOrder();
  const bills = await prisma.repair.findMany({
    where: { type: "SUSPENSION" },
    select: {
      id: true,
      receiptNo: true,
      repairItems: {
        orderBy: { id: "asc" },
        include: {
          part: { select: { name: true } },
          service: { select: { name: true } },
        },
      },
    },
  });

  let changed = 0;
  for (const bill of bills) {
    const tabItems = bill.repairItems.filter((item) => item.side);
    if (tabItems.length < 2) continue;

    const sorted = [...tabItems].sort(
      (a, b) =>
        isPerSideService(a) - isPerSideService(b) ||
        SIDE_RANK[a.side] - SIDE_RANK[b.side] ||
        compareTypes(a.side === "OTHER" ? order.other : order.side)(a, b) ||
        a.id - b.id,
    );
    if (sorted.every((item, i) => item.id === tabItems[i].id)) continue;

    changed++;
    const label = (items) =>
      items.map((item) => `${item.side[0]}:${typeOf(item)}`).join(", ");
    console.log(`#${bill.id} ${bill.receiptNo || ""}`);
    console.log(`  เดิม: ${label(tabItems)}`);
    console.log(`  ใหม่: ${label(sorted)}`);

    if (APPLY) {
      // รายการเรียงตาม id จึงย้ายเนื้อหาไปไว้ในแถวตามลำดับใหม่ แถวยังเป็นของบิลเดิมทั้งหมด
      const ids = tabItems.map((item) => item.id);
      await prisma.$transaction(
        sorted.map((src, i) =>
          prisma.repairItem.update({
            where: { id: ids[i] },
            data: {
              itemName: src.itemName,
              itemUnit: src.itemUnit,
              side: src.side,
              unitPrice: src.unitPrice,
              quantity: src.quantity,
              // ล็อตยางที่ตัดไปต้องย้ายตามรายการ ค่าว่างต้องเขียนเป็นว่างด้วย ไม่งั้นแถวปลายทางคงล็อตเดิมไว้
              soldLots: src.soldLots === null ? Prisma.DbNull : src.soldLots,
              partId: src.partId,
              serviceId: src.serviceId,
              createdAt: src.createdAt,
            },
          }),
        ),
      );
    }
  }

  console.log(
    `\n${changed} บิลจะเปลี่ยนลำดับ จากบิลเช็กช่วงล่างทั้งหมด ${bills.length} บิล ${
      APPLY ? "(บันทึกแล้ว)" : "(ยังไม่ได้บันทึก ใส่ --apply เพื่อบันทึก)"
    }`,
  );
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
