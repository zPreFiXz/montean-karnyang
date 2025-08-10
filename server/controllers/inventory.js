const prisma = require("../config/prisma");

exports.getInventory = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    let partWhereCondition = {};
    let serviceWhereCondition = {};

    // ถ้า category และ search ถูกระบุให้ค้นหาเฉพาะในหมวดหมู่และคำค้นหานั้น
    if (category && search) {
      partWhereCondition = {
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
      serviceWhereCondition = {
        AND: [{ category: { name: category } }, { name: { contains: search } }],
      };
      // ถ้า category ถูกระบุให้ค้นหาเฉพาะในหมวดหมู่นั้น
    } else if (category) {
      partWhereCondition.category = { name: category };
      serviceWhereCondition.category = { name: category };
      // ถ้า search ถูกระบุให้ค้นหาทั้งในชื่อ, รหัสอะไหล่ และยี่ห้อ
    } else if (search) {
      partWhereCondition.OR = [
        { name: { contains: search } },
        { brand: { contains: search } },
        { partNumber: { contains: search } },
      ];
      serviceWhereCondition.name = { contains: search };
    }

    // ถ้าไม่มีการระบุ category หรือ search ให้ค้นหาทุกอย่าง
    const [parts, services] = await Promise.all([
      prisma.part.findMany({
        where: partWhereCondition,
        include: { category: true },
        orderBy: { id: "asc" },
      }),
      prisma.service.findMany({
        where: serviceWhereCondition,
        include: { category: true },
        orderBy: { id: "asc" },
      }),
    ]);

    // รวมรายการอะไหล่และบริการในรูปแบบเดียวกัน
    // อะไหล่จะมีข้อมูลเพิ่มเติมเช่น partNumber, brand, costPrice, sellingPrice, unit, stockQuantity, minStockLevel
    // บริการจะไม่มีข้อมูลเหล่านี้ แต่จะมี price แทน
    const inventory = [
      ...parts.map((item) => ({
        ...item,
        category: { name: item.category.name },
      })),
      ...services.map((item) => ({
        ...item,
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
