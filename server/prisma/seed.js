const { PrismaClient } = require("@prisma/client");
const { categories } = require("./seeds/categories");
const { users } = require("./seeds/users");
const { parts } = require("./seeds/parts");
const { services } = require("./seeds/services");
const { VehicleBrandModels } = require("./seeds/vehicles");

const prisma = new PrismaClient();

async function main() {
  await Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: user,
      }),
    ),
  );

  await Promise.all(
    categories.map((category) =>
      prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      }),
    ),
  );

  await Promise.all(
    parts.map((part) =>
      prisma.part.upsert({
        where: { partNumber: part.partNumber },
        update: {},
        create: part,
      }),
    ),
  );

  await Promise.all(
    services.map((service) =>
      prisma.service.upsert({
        where: { name: service.name },
        update: {},
        create: service,
      }),
    ),
  );

  await Promise.all(
    VehicleBrandModels.map((vehicleBrandModel) =>
      prisma.vehicleBrandModel.upsert({
        where: {
          brand_model: {
            brand: vehicleBrandModel.brand,
            model: vehicleBrandModel.model,
          },
        },
        update: {},
        create: vehicleBrandModel,
      }),
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
