const prisma = require("../config/prisma");
const createError = require("../utils/createError");

// บรรทัดที่พิมพ์ชื่อทับตอนเปิดบิล ชื่อในคลังเป็นแค่ป้ายชั่วคราว ต้องแยกนับตามชื่อที่พิมพ์
// ไม่งั้น "อะไหล่อื่นๆ" ทุกบรรทัดจะรวมเป็นก้อนเดียวขึ้นอันดับหนึ่ง
// (ต้องตรงกับ PLACEHOLDER_SERVICE_NAMES ใน client/src/constants/services.js)
const PLACEHOLDER_SERVICE_NAMES = ["ค่าแรง", "บริการอื่นๆ", "อะไหล่อื่นๆ"];
// บริการที่จริงๆ เป็นของชิ้นหนึ่ง นับอยู่ฝั่งอะไหล่ (ต้องตรงกับ isPartLikeItem ฝั่งหน้าเว็บ)
const PART_LIKE_SERVICE_NAMES = ["อะไหล่อื่นๆ", "จุ๊บลม"];

const isDiscount = (item) =>
  (item.service?.name || item.itemName) === "ส่วนลด" ||
  Number(item.unitPrice) < 0;

// อะไหล่ขายดีในช่วงเวลาที่เลือก นับจากบิลที่เก็บเงินแล้วเท่านั้น ใช้ช่วงเวลาเดียวกับรายงานยอดขาย
// from/to ส่งมาจากหน้าเว็บที่คิดขอบเขตวันตามเวลาเครื่องของคนดูไว้แล้ว ตรงกับที่รายงานยอดขายแสดง
exports.listTopItems = async (req, res, next) => {
  try {
    const from = new Date(req.query.from);
    const to = new Date(req.query.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      createError(400, "ช่วงเวลาไม่ถูกต้อง");
    }

    const items = await prisma.repairItem.findMany({
      where: { repair: { status: "PAID", paidAt: { gte: from, lte: to } } },
      select: {
        itemName: true,
        itemUnit: true,
        unitPrice: true,
        quantity: true,
        part: {
          select: {
            id: true,
            brand: true,
            name: true,
            unit: true,
            attributes: true,
            secureUrl: true,
            category: { select: { name: true } },
          },
        },
        service: { select: { id: true, name: true, unit: true } },
      },
    });

    const groups = new Map();
    for (const item of items) {
      if (isDiscount(item)) continue;

      const serviceName = item.service?.name;
      const isPlaceholder = PLACEHOLDER_SERVICE_NAMES.includes(serviceName);
      const key = item.part
        ? `part:${item.part.id}`
        : item.service && !isPlaceholder
          ? `service:${item.service.id}`
          : `name:${serviceName || ""}:${(item.itemName || "").trim()}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          // บรรทัดที่ทั้งอะไหล่และบริการถูกลบจากคลังไปแล้ว เหลือแต่ชื่อในบิล เดิมเป็นอะไหล่
          // (บริการลบไม่ได้ถ้ามีบิลใช้อยู่ ดู delete guards)
          kind:
            item.part ||
            !item.service ||
            PART_LIKE_SERVICE_NAMES.includes(serviceName)
              ? "part"
              : "service",
          // อะไหล่ส่งข้อมูลไปให้หน้าเว็บประกอบชื่อเอง (ยางต้องเอาขนาดมาต่อ) บรรทัดอื่นใช้ชื่อในบิล
          part: item.part
            ? {
                brand: item.part.brand,
                name: item.part.name,
                attributes: item.part.attributes,
                category: item.part.category?.name,
                secureUrl: item.part.secureUrl,
              }
            : null,
          name: item.part
            ? item.part.name
            : isPlaceholder
              ? item.itemName || serviceName
              : serviceName || item.itemName,
          unit: item.part?.unit || item.itemUnit || item.service?.unit || "",
          quantity: 0,
          revenue: 0,
        });
      }

      const group = groups.get(key);
      const quantity = Number(item.quantity) || 0;
      group.quantity += quantity;
      group.revenue += quantity * Number(item.unitPrice || 0);
    }

    // หน้าสินค้าขายดีดูเฉพาะอะไหล่ ค่าแรงกับงานบริการไม่ใช่ของที่ขาย
    res.json([...groups.values()].filter((group) => group.kind === "part"));
  } catch (error) {
    next(error);
  }
};
