const prisma = require("../config/prisma");

exports.getInventory = async (req, res, next) => {
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
        include: { category: true },
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
      const ts = p.typeSpecificData || {};
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
