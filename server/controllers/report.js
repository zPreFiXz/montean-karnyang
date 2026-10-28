const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const { OIL_SOURCE_SELECT, withOilKitStock } = require("../utils/oilKit");

// บรรทัดที่พิมพ์ชื่อทับตอนเปิดบิล ชื่อในคลังเป็นแค่ป้ายชั่วคราว ต้องแยกนับตามชื่อที่พิมพ์
// ไม่งั้น "อะไหล่อื่นๆ" ทุกบรรทัดจะรวมเป็นก้อนเดียวขึ้นอันดับหนึ่ง
// (ต้องตรงกับ PLACEHOLDER_SERVICE_NAMES ใน client/src/constants/services.js)
const PLACEHOLDER_SERVICE_NAMES = ["ค่าแรง", "บริการอื่นๆ", "อะไหล่อื่นๆ"];
// บริการที่จริงๆ เป็นของชิ้นหนึ่ง นับอยู่ฝั่งอะไหล่ (ต้องตรงกับ isPartLikeItem ฝั่งหน้าเว็บ)
const PART_LIKE_SERVICE_NAMES = ["อะไหล่อื่นๆ", "จุ๊บลม"];

const isDiscount = (item) =>
  (item.service?.name || item.itemName) === "ส่วนลด" ||
  Number(item.unitPrice) < 0;

// ขอบเขตวันส่งมาจากหน้าเว็บ ตรงกับรายงานยอดขาย
const parseRange = (query) => {
  const from = new Date(query.from);
  const to = new Date(query.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    createError(400, "ช่วงเวลาไม่ถูกต้อง");
  }
  return { from, to };
};

const PART_ITEM_SELECT = {
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
  service: {
    select: { id: true, name: true, unit: true, secureUrl: true },
  },
};

// รวมบรรทัดในบิลเป็นรายการอะไหล่ ใช้ทั้งอันดับอะไหล่และอะไหล่ของรุ่นรถ ทั้งสองหน้าจะนับแบบเดียวกัน
const groupPartItems = (items) => {
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
        part: item.part
          ? {
              id: item.part.id,
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
        secureUrl: item.part?.secureUrl || item.service?.secureUrl || null,
        quantity: 0,
        revenue: 0,
      });
    }

    const group = groups.get(key);
    const quantity = Number(item.quantity) || 0;
    group.quantity += quantity;
    group.revenue += quantity * Number(item.unitPrice || 0);
  }

  return [...groups.values()].filter((group) => group.kind === "part");
};

// นับจากบิลที่เก็บเงินแล้ว
exports.listTopItems = async (req, res) => {
  const { from, to } = parseRange(req.query);

  const items = await prisma.repairItem.findMany({
    where: { repair: { status: "PAID", paidAt: { gte: from, lte: to } } },
    select: PART_ITEM_SELECT,
  });

  res.json(groupPartItems(items));
};

exports.listTopVehicleModels = async (req, res) => {
  const { from, to } = parseRange(req.query);

  const repairs = await prisma.repair.findMany({
    where: {
      status: "PAID",
      paidAt: { gte: from, lte: to },
      vehicleId: { not: null },
    },
    select: {
      totalPrice: true,
      vehicleId: true,
      vehicle: {
        select: {
          vehicleModel: { select: { id: true, brand: true, model: true } },
        },
      },
    },
  });

  const groups = new Map();
  for (const repair of repairs) {
    const model = repair.vehicle?.vehicleModel;
    if (!model) continue;
    if (!groups.has(model.id)) {
      groups.set(model.id, {
        key: `model:${model.id}`,
        id: model.id,
        brand: model.brand,
        model: model.model,
        visits: 0,
        vehicleIds: new Set(),
        revenue: 0,
      });
    }
    const group = groups.get(model.id);
    group.visits += 1;
    group.vehicleIds.add(repair.vehicleId);
    group.revenue += Number(repair.totalPrice) || 0;
  }

  res.json(
    [...groups.values()].map(({ vehicleIds, ...group }) => ({
      ...group,
      vehicles: vehicleIds.size,
    })),
  );
};

// อะไหล่ที่ขายให้รถรุ่นนี้ในช่วงเวลาที่เลือก คู่กับสต็อกตอนนี้ และรถรุ่นนี้ที่เข้าร้าน ใช้ตัดสินใจสั่งของ
exports.getVehicleModelReport = async (req, res) => {
  const { from, to } = parseRange(req.query);
  const vehicleModelId = Number(req.params.id);
  if (!Number.isInteger(vehicleModelId)) {
    createError(400, "รหัสไม่ถูกต้อง");
  }

  const paidInRange = {
    status: "PAID",
    paidAt: { gte: from, lte: to },
    vehicle: { vehicleModelId },
  };

  const [items, repairs] = await Promise.all([
    prisma.repairItem.findMany({
      where: { repair: paidInRange },
      select: PART_ITEM_SELECT,
    }),
    prisma.repair.findMany({
      where: paidInRange,
      select: {
        paidAt: true,
        vehicle: {
          select: {
            id: true,
            licensePlate: { select: { plateNumber: true, province: true } },
          },
        },
      },
    }),
  ]);

  const parts = groupPartItems(items);
  const partIds = parts.map((group) => group.part?.id).filter(Boolean);
  const stocks = await prisma.part.findMany({
    where: { id: { in: partIds } },
    select: {
      id: true,
      stockQuantity: true,
      minStockLevel: true,
      unit: true,
      oilSourceId: true,
      oilLiters: true,
      oilSource: OIL_SOURCE_SELECT,
    },
  });
  const stockById = new Map(
    stocks.map((part) => {
      const withStock = withOilKitStock(part);
      return [
        part.id,
        {
          stockQuantity: Number(withStock.stockQuantity) || 0,
          minStockLevel: withStock.minStockLevel,
          isOilKit: Boolean(part.oilSourceId && part.oilSource),
        },
      ];
    }),
  );

  const vehicles = new Map();
  for (const repair of repairs) {
    const vehicle = repair.vehicle;
    if (!vehicles.has(vehicle.id)) {
      vehicles.set(vehicle.id, {
        id: vehicle.id,
        licensePlate: vehicle.licensePlate,
        visits: 0,
        lastPaidAt: repair.paidAt,
      });
    }
    const entry = vehicles.get(vehicle.id);
    entry.visits += 1;
    if (repair.paidAt > entry.lastPaidAt) entry.lastPaidAt = repair.paidAt;
  }

  res.json({
    parts: parts.map((group) => ({
      ...group,
      stock: group.part ? stockById.get(group.part.id) || null : null,
    })),
    vehicles: [...vehicles.values()],
  });
};
