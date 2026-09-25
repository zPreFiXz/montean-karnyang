const prisma = require("../config/prisma");
const createError = require("../utils/createError");

// แปลง service ให้มีโครงสร้างเดียวกับ part เพื่อให้ client แสดงคลังสินค้ารวมกันได้
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
  publicId: null,
  secureUrl: null,
  category: { name: service.category.name },
});

// เรียงไทย/อังกฤษ/ตัวเลขให้ถูกหลักภาษา (localeCompare เปล่าๆ เรียงสระนำภาษาไทยผิด)
const collator = new Intl.Collator("th", {
  numeric: true,
  sensitivity: "base",
});

// ยาง: ยี่ห้อ -> หน้ายาง -> แก้มยาง -> ขอบ -> รุ่น
// อื่นๆ: attributes ว่าง จึงเทียบเท่ากันแล้วตกไปเรียงด้วยชื่อตามปกติ
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

exports.listInventory = async (req, res, next) => {
  try {
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

    const inventory = [
      ...filteredParts.map((item) => ({
        ...item,
        type: "part",
        category: { name: item.category.name },
      })),
      ...services.map(mapServiceToInventoryItem),
    ].sort(compareInventory);

    res.json(inventory);
  } catch (error) {
    next(error);
  }
};

exports.getInventory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    let inventory = null;

    if (type === "part") {
      inventory = await prisma.part.findUnique({
        where: { id: Number(id) },
        include: {
          category: true,
          tireLots: { orderBy: { createdAt: "asc" } },
        },
      });

      if (inventory) {
        inventory = {
          ...inventory,
          type: "part",
          category: { name: inventory.category.name },
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
  } catch (error) {
    next(error);
  }
};

// บิลทั้งหมดที่เคยใช้อะไหล่หรือบริการตัวนี้ ใช้ในหน้า "รถที่เคยใช้"
// รวมบรรทัดของบิลเดียวกันเข้าด้วยกัน (ยางซ้าย-ขวาอยู่คนละบรรทัดแต่เป็นบิลใบเดียว)
exports.listInventoryRepairs = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const itemId = Number(id);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      createError(400, "รหัสไม่ถูกต้อง");
    }
    if (type !== "part" && type !== "service") {
      createError(400, "ชนิดรายการไม่ถูกต้อง");
    }

    const items = await prisma.repairItem.findMany({
      where: type === "service" ? { serviceId: itemId } : { partId: itemId },
      select: {
        quantity: true,
        unitPrice: true,
        // ชื่อที่บันทึกไว้ในบิลใบนั้น — รายการเปล่าอย่างอะไหล่อื่นๆ ถูกพิมพ์ชื่อทับเป็นรายใบ
        // หน้าประวัติการใช้เอาไว้ค้นหาและบอกว่าบิลนั้นเรียกของชิ้นนี้ว่าอะไร
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
        // บิลเดียวอาจมีหลายบรรทัดและตั้งชื่อคนละอย่าง เก็บให้ครบแบบไม่ซ้ำ
        if (item.itemName && !current.itemNames.includes(item.itemName)) {
          current.itemNames.push(item.itemName);
        }
      } else {
        byRepair.set(item.repair.id, {
          repair: item.repair,
          quantity: Number(item.quantity),
          total: Number(item.quantity) * item.unitPrice,
          itemNames: item.itemName ? [item.itemName] : [],
        });
      }
    }

    res.json([...byRepair.values()]);
  } catch (error) {
    next(error);
  }
};

// หน่วยที่เคยใช้แล้ว แยกของอะไหล่กับบริการ ช่องเลือกหน่วยเอาไปแสดงเป็นรายการ
// ไม่มีรายการตั้งต้นในโค้ด หน่วยที่พิมพ์เพิ่มครั้งเดียวจึงโผล่ให้เลือกครั้งต่อไปเอง
// อะไหล่: หน่วยที่ตั้งไว้กับอะไหล่ในคลัง + ที่พิมพ์บนบรรทัดอะไหล่อื่นๆ ในบิล
// บริการ: หน่วยที่ตั้งไว้กับบริการ + ที่พิมพ์บนบรรทัดบริการอื่นๆ ในบิล
// เรียงตามจำนวนครั้งที่ใช้ ตัวที่ใช้บ่อยอยู่บนสุด
exports.listUnits = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};
