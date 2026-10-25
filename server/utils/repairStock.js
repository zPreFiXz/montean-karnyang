const { Prisma } = require("@prisma/client");
const createError = require("./createError");
const { buildPartItemName, buildServiceItemName } = require("./repairItemName");

// เรียงล็อตเก่าสุดก่อน (FIFO): DOT รูปแบบ WWYY → เทียบปี(YY) ก่อน แล้วสัปดาห์(WW)
// ล็อต "ไม่ระบุ" (backfill) หรือรูปแบบผิด ถือว่าเก่าสุด ขายออกก่อน
const dotOrderKey = (dotCode) => {
  const matched = /^(\d{2})(\d{2})$/.exec(dotCode || "");
  if (!matched) return -1;
  const [, week, year] = matched;
  return Number(year) * 100 + Number(week);
};

// ตัดสต็อกยางแบบ FIFO ข้ามหลายล็อตได้ คืนล็อตที่ตัด [{ dotCode, quantity }]
// คืน null ถ้า Part ไม่มีล็อต (ไม่ใช่ยางที่ track ล็อต) → ให้ผู้เรียกตัด stockQuantity แบบเดิม
const deductTireLotsFifo = async (tx, partId, quantity) => {
  const lots = await tx.tireLot.findMany({ where: { partId } });
  if (!lots.length) return null;

  lots.sort((a, b) => dotOrderKey(a.dotCode) - dotOrderKey(b.dotCode));

  let remaining = quantity;
  const consumed = [];
  for (const lot of lots) {
    if (remaining <= 0) break;
    const take = Math.min(lot.quantity, remaining);
    if (take <= 0) continue;
    remaining -= take;
    consumed.push({ dotCode: lot.dotCode, quantity: take });
    const left = lot.quantity - take;
    if (left <= 0) {
      await tx.tireLot.delete({ where: { id: lot.id } });
    } else {
      await tx.tireLot.update({
        where: { id: lot.id },
        data: { quantity: left },
      });
    }
  }
  return consumed.length ? consumed : null;
};

const restoreTireLotsFromSoldLots = async (tx, partId, soldLots) => {
  if (!Array.isArray(soldLots)) return;
  for (const lot of soldLots) {
    const dot = String(lot?.dotCode ?? "").trim();
    const qty = Number(lot?.quantity);
    if (!dot || !Number.isFinite(qty) || qty <= 0) continue;

    const existing = await tx.tireLot.findFirst({
      where: { partId, dotCode: dot },
    });
    if (existing) {
      await tx.tireLot.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + qty },
      });
    } else {
      await tx.tireLot.create({
        data: { partId, dotCode: dot, quantity: qty },
      });
    }
  }
};

// ชุดน้ำมันเครื่องไม่มีสต็อกของตัวเอง ตัด/คืนที่ตัวเก็บน้ำมันแทน เป็นลิตร (จำนวนชุด × ลิตรต่อชุด)
// ของอื่นตัด/คืนที่ตัวเอง ตามจำนวนในบิล
const stockTargetOf = (part, partId, quantity) =>
  part?.oilSourceId && part?.oilLiters
    ? {
        partId: part.oilSourceId,
        amount: Number(quantity) * Number(part.oilLiters),
      }
    : { partId, amount: quantity };

const formatAmount = (value) => Number(Number(value).toFixed(2));

const STOCK_PART_SELECT = {
  id: true,
  brand: true,
  name: true,
  unit: true,
  attributes: true,
  stockQuantity: true,
  category: { select: { name: true } },
};

const shortageError = (part, have, need) => {
  const name = part ? buildPartItemName(part) : "";
  const unit = part?.unit ? ` ${part.unit}` : "";
  createError(
    400,
    `สต็อก ${name} ไม่พอ (เหลือ ${formatAmount(have)}${unit} ต้องใช้ ${formatAmount(need)}${unit})`,
  );
};

// รวมยอดของอะไหล่ตัวเดียวกันทุกบรรทัดก่อนเทียบ ข้อความจะได้บอกจำนวนจริงของทั้งบิล
// lines = [{ part, partId, quantity }] โดย part ต้องมี oilSourceId กับ oilLiters
const ensureStockAvailable = async (tx, lines) => {
  const need = new Map();
  for (const line of lines) {
    if (!line.partId) continue;
    const target = stockTargetOf(line.part, line.partId, line.quantity);
    need.set(
      target.partId,
      (need.get(target.partId) || 0) + Number(target.amount),
    );
  }
  if (need.size === 0) return;

  const parts = await tx.part.findMany({
    where: { id: { in: [...need.keys()] } },
    select: STOCK_PART_SELECT,
  });
  for (const part of parts) {
    if (Number(part.stockQuantity) < need.get(part.id)) {
      shortageError(part, part.stockQuantity, need.get(part.id));
    }
  }
};

// ตัดแบบมีเงื่อนไขในคำสั่งเดียว กันสองเครื่องขายชิ้นสุดท้ายพร้อมกัน
const moveStock = async (tx, part, partId, quantity, direction) => {
  const target = stockTargetOf(part, partId, quantity);
  if (direction === "increment") {
    await tx.part.update({
      where: { id: target.partId },
      data: { stockQuantity: { increment: target.amount } },
    });
    return;
  }

  const { count } = await tx.part.updateMany({
    where: { id: target.partId, stockQuantity: { gte: target.amount } },
    data: { stockQuantity: { decrement: target.amount } },
  });
  if (count === 0) {
    const current = await tx.part.findUnique({
      where: { id: target.partId },
      select: STOCK_PART_SELECT,
    });
    shortageError(current, current?.stockQuantity ?? 0, target.amount);
  }
};

// ใบประเมินราคายังไม่ได้ซ่อม ของต้องอยู่ในคลัง ย้ายเข้า/ออกสถานะนี้จึงคืนหรือตัดสต็อก
const restoreStockForRepair = async (tx, repairId) => {
  const items = await tx.repairItem.findMany({
    where: { repairId },
    include: {
      part: { select: { name: true, oilSourceId: true, oilLiters: true } },
    },
  });

  for (const item of items) {
    if (!item.partId) continue;

    await moveStock(tx, item.part, item.partId, item.quantity, "increment");
    await restoreTireLotsFromSoldLots(tx, item.partId, item.soldLots);
    await tx.repairItem.update({
      where: { id: item.id },
      data: { soldLots: Prisma.DbNull },
    });
  }
};

const deductStockForRepair = async (tx, repairId) => {
  const items = await tx.repairItem.findMany({
    where: { repairId },
    include: {
      part: { select: { name: true, oilSourceId: true, oilLiters: true } },
    },
  });

  await ensureStockAvailable(tx, items);

  for (const item of items) {
    if (!item.partId) continue;

    const soldLots = await deductTireLotsFifo(tx, item.partId, item.quantity);
    await moveStock(tx, item.part, item.partId, item.quantity, "decrement");
    await tx.repairItem.update({
      where: { id: item.id },
      data: { soldLots: soldLots ?? Prisma.DbNull },
    });
  }
};

const createRepairItemsAndDecrementStock = async (
  tx,
  repairId,
  repairItems,
  // ใบประเมินราคาบันทึกรายการอย่างเดียว ของยังไม่ได้ถูกเบิกออกจากคลัง
  deductStock = true,
) => {
  // snapshot ชื่อ ณ วันซ่อม เผื่ออะไหล่ถูกลบภายหลัง
  const partIds = repairItems.map((i) => i.partId).filter(Boolean);
  const serviceIds = repairItems.map((i) => i.serviceId).filter(Boolean);

  const [parts, services] = await Promise.all([
    partIds.length
      ? tx.part.findMany({
          where: { id: { in: partIds } },
          select: {
            id: true,
            brand: true,
            name: true,
            attributes: true,
            oilSourceId: true,
            oilLiters: true,
            category: { select: { name: true } },
          },
        })
      : [],
    serviceIds.length
      ? tx.service.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, name: true },
        })
      : [],
  ]);

  const partById = new Map(parts.map((p) => [p.id, p]));
  const serviceById = new Map(services.map((s) => [s.id, s]));

  if (deductStock) {
    await ensureStockAvailable(
      tx,
      repairItems.map((item) => ({ ...item, part: partById.get(item.partId) })),
    );
  }

  for (const item of repairItems) {
    let soldLots = null;
    if (deductStock && item.partId) {
      soldLots = await deductTireLotsFifo(tx, item.partId, item.quantity);
      await moveStock(
        tx,
        partById.get(item.partId),
        item.partId,
        item.quantity,
        "decrement",
      );
    }

    await tx.repairItem.create({
      data: {
        side: item.side || null,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        // ช่อง JSON ถ้าส่ง null ธรรมดา Prisma จะเก็บเป็นคำว่า null ในช่อง ไม่ใช่ช่องว่างของฐานข้อมูล
        // ต้องบอกด้วย DbNull ว่าให้เว้นช่องไว้จริงๆ (รายการที่ไม่ใช่ยางไม่มีล็อตให้เก็บ)
        soldLots: soldLots ?? Prisma.DbNull,
        repairId,
        partId: item.partId,
        serviceId: item.serviceId,
        // ใช้ชื่อที่ส่งมาก่อน ไม่ได้พิมพ์มาค่อยประกอบจากคลัง
        itemName:
          item.itemName?.trim() ||
          (item.partId
            ? buildPartItemName(partById.get(item.partId))
            : buildServiceItemName(serviceById.get(item.serviceId))),
        itemUnit: item.itemUnit || null,
      },
    });
  }
};

module.exports = {
  restoreTireLotsFromSoldLots,
  moveStock,
  restoreStockForRepair,
  deductStockForRepair,
  createRepairItemsAndDecrementStock,
  ensureStockAvailable,
};
