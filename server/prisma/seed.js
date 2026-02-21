const { PrismaClient } = require("@prisma/client");
const { categories } = require("./seeds/categories");
const { users } = require("./seeds/users");
const { parts } = require("./seeds/parts");
const { services } = require("./seeds/services");
const { VehicleBrands } = require("./seeds/vehicles");

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

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

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
    VehicleBrands.map((vehicleBrand) =>
      prisma.vehicleBrand.upsert({
        where: {
          brand_model: {
            brand: vehicleBrand.brand,
            model: vehicleBrand.model,
          },
        },
        update: {},
        create: vehicleBrand,
      }),
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.log(e);
    await prisma.$disconnect();
    process.exit(1);
  });
