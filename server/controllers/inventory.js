const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const { OIL_SOURCE_SELECT, withOilKitStock } = require("../utils/oilKit");
const { loadVehicleSorter } = require("../utils/vehicleOrder");
const { cloudinary, UPLOAD_FOLDER } = require("../utils/cloudinaryImage");
const {
  buildPartItemName,
  buildServiceItemName,
  oilUseItemNames,
} = require("../utils/repairItemName");

const mapServiceToInventoryItem = (service) => ({
  ...service,
  type: "service",
  partNumber: null,
  brand: null,
  costPrice: null,
  sellingPrice: service.price,
  unit: service.unit || null,
  stockQuantity: 0,
  minStockLevel: 0,
  // รูปเดียวกับอะไหล่ (attributes.perSide) หน้าเว็บจะได้ใช้ตัวเช็กฝั่งตัวเดียวกัน
  attributes: { perSide: !!service.perSide },
  compatibleVehicles: null,
  publicId: service.publicId || null,
  secureUrl: service.secureUrl || null,
  category: { name: service.category.name },
});

// ยางเปอร์เซ็นต์สภาพไม่เท่ากัน จึงบอกราคาที่เคยขายจริง ไม่นับใบเสนอราคาและราคา 0
const USED_TIRE_CATEGORY = "ยางเปอร์เซ็นต์";
const soldPriceStats = async (partIds) => {
  if (partIds.length === 0) return new Map();
  const rows = await prisma.repairItem.groupBy({
    by: ["partId", "unitPrice"],
    where: {
      partId: { in: partIds },
      unitPrice: { gt: 0 },
      repair: { status: { notIn: ["ESTIMATE", "CANCELLED"] } },
    },
    _sum: { quantity: true },
    orderBy: { unitPrice: "asc" },
  });
  const stats = new Map();
  for (const row of rows) {
    const entry = stats.get(row.partId) || { prices: [] };
    entry.prices.push({
      price: row.unitPrice,
      quantity: Number(row._sum.quantity) || 0,
    });
    stats.set(row.partId, entry);
  }
  for (const entry of stats.values()) {
    entry.range = {
      min: entry.prices[0].price,
      max: entry.prices[entry.prices.length - 1].price,
    };
  }
  return stats;
};
const usedTireIds = (parts) =>
  parts
    .filter((part) => part.category?.name === USED_TIRE_CATEGORY)
    .map((part) => part.id);

// เรียงไทย/อังกฤษ/ตัวเลขให้ถูกหลักภาษา (localeCompare เปล่าๆ เรียงสระนำภาษาไทยผิด)
const collator = new Intl.Collator("th", {
  numeric: true,
  sensitivity: "base",
});

const bySize = (a, b, key) => {
  const x = Number(a.attributes?.[key]);
  const y = Number(b.attributes?.[key]);
  if (Number.isNaN(x) && Number.isNaN(y)) return 0;
  if (Number.isNaN(x)) return 1;
  if (Number.isNaN(y)) return -1;
  return x - y;
};

const compareInventory = (a, b) =>
  collator.compare(a.brand || "", b.brand || "") ||
  bySize(a, b, "width") ||
  bySize(a, b, "aspectRatio") ||
  bySize(a, b, "rimDiameter") ||
  collator.compare(a.name || "", b.name || "");

exports.listInventory = async (req, res) => {
  const { category, search, width, aspectRatio, rimDiameter, brand } =
    req.query;

  let partFilter = {};
  let serviceFilter = {};

  if (category && search) {
    partFilter = {
      AND: [
        { category: { name: category } },
        {
          OR: [
            { partNumber: { contains: search } },
            { name: { contains: search } },
            { brand: { contains: search } },
          ],
        },
      ],
    };
    serviceFilter = {
      AND: [{ category: { name: category } }, { name: { contains: search } }],
    };
  } else if (category) {
    partFilter.category = { name: category };
    serviceFilter.category = { name: category };
  } else if (search) {
    partFilter.OR = [
      { name: { contains: search } },
      { brand: { contains: search } },
      { partNumber: { contains: search } },
    ];
    serviceFilter.name = { contains: search };
  }
  if (brand) {
    partFilter.brand = { contains: brand };
  }

  const [parts, services] = await Promise.all([
    prisma.part.findMany({
      where: partFilter,
      include: {
        category: true,
        tireLots: { orderBy: { createdAt: "asc" } },
        oilSource: OIL_SOURCE_SELECT,
      },
    }),
    prisma.service.findMany({
      where: serviceFilter,
      include: { category: true },
    }),
  ]);

  const matches = (value, q) => {
    if (q === undefined || q === null || q === "") return true;
    if (value === undefined || value === null) return false;
    return String(value).toLowerCase() === String(q).toLowerCase();
  };

  const filteredParts = parts.filter((p) => {
    const ts = p.attributes || {};
    return (
      matches(ts.width, width) &&
      matches(ts.aspectRatio, aspectRatio) &&
      matches(ts.rimDiameter, rimDiameter)
    );
  });

  const [priceStats, sortVehicles] = await Promise.all([
    soldPriceStats(usedTireIds(filteredParts)),
    loadVehicleSorter(),
  ]);

  const inventory = [
    ...filteredParts.map(withOilKitStock).map((item) => ({
      ...item,
      compatibleVehicles: sortVehicles(item.compatibleVehicles),
      type: "part",
      category: { name: item.category.name },
      soldPriceRange: priceStats.get(item.id)?.range || null,
      soldPrices: priceStats.get(item.id)?.prices || null,
    })),
    ...services.map(mapServiceToInventoryItem),
  ].sort(compareInventory);

  res.json(inventory);
};

exports.getInventory = async (req, res) => {
  const { id } = req.params;
  const { type } = req.query;

  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    createError(400, "รหัสไม่ถูกต้อง");
  }

  let inventory = null;

  if (type === "part") {
    inventory = await prisma.part.findUnique({
      where: { id: Number(id) },
      include: {
        category: true,
        tireLots: { orderBy: { createdAt: "asc" } },
        oilSource: OIL_SOURCE_SELECT,
      },
    });

    if (inventory) {
      const [priceStats, sortVehicles] = await Promise.all([
        soldPriceStats(usedTireIds([inventory])),
        loadVehicleSorter(),
      ]);
      // ต้องคิดสต็อกชุดน้ำมันเหมือนหน้ารายการ ไม่งั้นหน้าต่างที่เปิดหลังแก้จะขึ้นจำนวนในฐานข้อมูลแทน
      inventory = {
        ...withOilKitStock(inventory),
        compatibleVehicles: sortVehicles(inventory.compatibleVehicles),
        type: "part",
        category: { name: inventory.category.name },
        soldPriceRange: priceStats.get(inventory.id)?.range || null,
        soldPrices: priceStats.get(inventory.id)?.prices || null,
      };
    }
  } else if (type === "service") {
    const service = await prisma.service.findUnique({
      where: { id: Number(id) },
      include: { category: true },
    });

    if (service) {
      inventory = mapServiceToInventoryItem(service);
    }
  }

  res.json(inventory);
};

// รวมบรรทัดของบิลเดียวกัน (ยางซ้าย-ขวาอยู่คนละบรรทัด)
exports.listInventoryRepairs = async (req, res) => {
  const { type, id } = req.params;
  const itemId = Number(id);

  if (!Number.isInteger(itemId) || itemId <= 0) {
    createError(400, "รหัสไม่ถูกต้อง");
  }
  if (type !== "part" && type !== "service") {
    createError(400, "ชนิดรายการไม่ถูกต้อง");
  }

  // ชื่อที่ระบบใส่ให้ตอนเพิ่มลงบิล ชื่ออื่นคือชื่อที่พิมพ์เอง หน้าเว็บแสดงเฉพาะชื่อพวกนั้น
  const part =
    type === "part"
      ? await prisma.part.findUnique({
          where: { id: itemId },
          include: { category: true },
        })
      : null;
  const systemNames =
    type === "service"
      ? [
          buildServiceItemName(
            await prisma.service.findUnique({ where: { id: itemId } }),
          ),
        ]
      : [buildPartItemName(part), ...oilUseItemNames(part)];
  // บิลเก่ามีขนาดขวดในชื่อ เช่น "VALVOLINE (1L) น้ำมันเครื่อง ..."
  const isTypedName = (name) =>
    !!name &&
    !systemNames.includes(name) &&
    !systemNames.includes(name.replace(/ \(\d+(\.\d+)?L\)/, ""));

  const items = await prisma.repairItem.findMany({
    // บิลที่ยกเลิกคืนของเข้าคลังไปแล้ว ไม่นับว่าใช้ไป
    where: {
      ...(type === "service" ? { serviceId: itemId } : { partId: itemId }),
      repair: { status: { not: "CANCELLED" } },
    },
    select: {
      quantity: true,
      unitPrice: true,
      itemName: true,
      repair: {
        include: {
          customer: { select: { name: true } },
          repairItems: { select: { itemName: true, partId: true } },
          vehicle: {
            include: {
              licensePlate: {
                select: { plateNumber: true, province: true },
              },
              vehicleModel: { select: { brand: true, model: true } },
            },
          },
        },
      },
    },
    orderBy: { repair: { createdAt: "desc" } },
  });

  const byRepair = new Map();
  for (const item of items) {
    const current = byRepair.get(item.repair.id);
    if (current) {
      current.quantity += Number(item.quantity);
      current.total += Number(item.quantity) * item.unitPrice;
      if (
        isTypedName(item.itemName) &&
        !current.itemNames.includes(item.itemName)
      ) {
        current.itemNames.push(item.itemName);
      }
    } else {
      byRepair.set(item.repair.id, {
        repair: item.repair,
        quantity: Number(item.quantity),
        total: Number(item.quantity) * item.unitPrice,
        itemNames: isTypedName(item.itemName) ? [item.itemName] : [],
      });
    }
  }

  res.json([...byRepair.values()]);
};

// ไม่มีรายการตั้งต้นในโค้ด หน่วยที่พิมพ์เพิ่มจะโผล่ให้เลือกครั้งต่อไปเอง เรียงตามที่ใช้บ่อย
exports.listUnits = async (req, res) => {
  const [parts, services, partLines, serviceLines] = await Promise.all([
    prisma.part.groupBy({ by: ["unit"], _count: { _all: true } }),
    prisma.service.groupBy({
      by: ["unit"],
      where: { unit: { not: null } },
      _count: { _all: true },
    }),
    prisma.repairItem.groupBy({
      by: ["itemUnit"],
      where: { itemUnit: { not: null }, service: { name: "อะไหล่อื่นๆ" } },
      _count: { _all: true },
    }),
    prisma.repairItem.groupBy({
      by: ["itemUnit"],
      where: {
        itemUnit: { not: null },
        serviceId: { not: null },
        service: { name: { not: "อะไหล่อื่นๆ" } },
      },
      _count: { _all: true },
    }),
  ]);

  const rank = (...sources) => {
    const counts = new Map();
    for (const [rows, field] of sources) {
      for (const row of rows) {
        const name = String(row[field] || "").trim();
        if (name) counts.set(name, (counts.get(name) || 0) + row._count._all);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || collator.compare(a[0], b[0]))
      .map(([name]) => name);
  };

  res.json({
    partUnits: rank([parts, "unit"], [partLines, "itemUnit"]),
    serviceUnits: rank([services, "unit"], [serviceLines, "itemUnit"]),
  });
};

// ขนาดรูปไม่ได้เก็บในฐานข้อมูล ถาม Cloudinary ทีละ 500 รูป (Admin API จำกัดจำนวนครั้งต่อชั่วโมง จึงจำไว้สักพัก)
const IMAGE_SIZE_TTL_MS = 5 * 60 * 1000;
let imageSizeCache = null;

const loadImageSizes = async () => {
  if (imageSizeCache && Date.now() - imageSizeCache.at < IMAGE_SIZE_TTL_MS) {
    return imageSizeCache.sizes;
  }
  const sizes = new Map();
  let cursor;
  do {
    const page = await cloudinary.api.resources({
      type: "upload",
      prefix: `${UPLOAD_FOLDER}/`,
      max_results: 500,
      next_cursor: cursor,
    });
    for (const r of page.resources) {
      sizes.set(r.public_id, { width: r.width, height: r.height });
    }
    cursor = page.next_cursor;
  } while (cursor);
  imageSizeCache = { at: Date.now(), sizes };
  return sizes;
};

// ต่างกันไม่เกิน 1% ถือว่าจัตุรัส (รูปที่ครอปมือมักคลาดไม่กี่พิกเซล)
const isSquare = ({ width, height }) =>
  Math.abs(width - height) / Math.max(width, height) <= 0.01;

exports.listImageIssues = async (req, res) => {
  const [sizes, parts, services] = await Promise.all([
    loadImageSizes(),
    prisma.part.findMany({
      where: { publicId: { not: null } },
      select: { id: true, publicId: true },
    }),
    prisma.service.findMany({
      where: { publicId: { not: null } },
      select: { id: true, publicId: true },
    }),
  ]);

  const issues = [
    ...parts.map((item) => ({ ...item, type: "part" })),
    ...services.map((item) => ({ ...item, type: "service" })),
  ]
    .map(({ id, type, publicId }) => ({ id, type, ...sizes.get(publicId) }))
    .filter((item) => item.width && item.height && !isSquare(item));

  res.json(issues);
};
