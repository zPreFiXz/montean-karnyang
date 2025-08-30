const prisma = require("../config/prisma");

exports.getInventory = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    let partFilter = {};
    let serviceFilter = {};

    // ถ้า category และ search ถูกระบุให้ค้นหาเฉพาะในหมวดหมู่และคำค้นหานั้น
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
      // ถ้า category ถูกระบุให้ค้นหาเฉพาะในหมวดหมู่นั้น
    } else if (category) {
      partFilter.category = { name: category };
      serviceFilter.category = { name: category };
      // ถ้า search ถูกระบุให้ค้นหาทั้งในชื่อ, รหัสอะไหล่ และยี่ห้อ
    } else if (search) {
      partFilter.OR = [
        { name: { contains: search } },
        { brand: { contains: search } },
        { partNumber: { contains: search } },
      ];
      serviceFilter.name = { contains: search };
    }

    // ถ้าไม่มีการระบุ category หรือ search ให้ค้นหาทุกอย่าง
    const [parts, services] = await Promise.all([
      prisma.part.findMany({
        where: partFilter,
        include: { category: true },
      }),
      prisma.service.findMany({
        where: serviceFilter,
        include: { category: true },
      }),
    ]);

    // รวมรายการอะไหล่และบริการในรูปแบบเดียวกัน
    // อะไหล่จะมีข้อมูลเพิ่มเติมเช่น partNumber, brand, costPrice, sellingPrice, unit, stockQuantity, minStockLevel
    // บริการจะไม่มีข้อมูลเหล่านี้ แต่จะมี price แทน
    const inventory = [
      ...parts.map((item) => ({
        ...item,
        type: "part",
        category: { name: item.category.name },
      })),
      ...services.map((item) => ({
        ...item,
        type: "service",
        partNumber: null,
        brand: null,
        costPrice: 0,
        sellingPrice: item.price,
        unit: null,
        stockQuantity: 0,
        minStockLevel: 0,
        typeSpecificData: null,
        compatibleVehicles: null,
        publicId: null,
        secureUrl: null,
        category: { name: item.category.name },
      })),
    ];

    res.json(inventory);
  } catch (error) {
    next(error);
  }
};

exports.getInventoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    let inventory = null;

    if (type === "part") {
      inventory = await prisma.part.findUnique({
        where: { id: Number(id) },
        include: { category: true },
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
        inventory = {
          ...service,
          type: "service",
          partNumber: null,
          brand: null,
          costPrice: 0,
          sellingPrice: service.price,
          unit: null,
          stockQuantity: 0,
          minStockLevel: 0,
          typeSpecificData: null,
          compatibleVehicles: null,
          publicId: null,
          secureUrl: null,
          category: { name: service.category.name },
        };
      }
    }

    res.json(inventory);
  } catch (error) {
    next(error);
  }
};
