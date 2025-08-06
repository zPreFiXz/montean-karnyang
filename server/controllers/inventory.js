const prisma = require("../config/prisma");

exports.getInventory = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    let partWhereCondition = {};
    let serviceWhereCondition = {};

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
    } else if (category) {
      partWhereCondition.category = { name: category };
      serviceWhereCondition.category = { name: category };
    } else if (search) {
      partWhereCondition.OR = [
        { name: { contains: search } },
        { brand: { contains: search } },
        { partNumber: { contains: search } },
      ];
      serviceWhereCondition.name = { contains: search };
    }

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
