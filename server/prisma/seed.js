const { PrismaClient } = require("@prisma/client");
const { categories } = require("./seeds/categories");
const { users } = require("./seeds/users");
const { parts } = require("./seeds/parts");
const { services } = require("./seeds/services");
const { VehicleBrandModels } = require("./seeds/vehicles");

const prisma = new PrismaClient();

async function main() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  for (const part of parts) {
    await prisma.part.upsert({
      where: { partNumber: part.partNumber },
      update: {},
      create: part,
    });
  }

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {},
      create: service,
    });
  }

  for (const vehicleBrandModel of VehicleBrandModels) {
    await prisma.vehicleBrandModel.upsert({
      where: { 
        brand_model: {
          brand: vehicleBrandModel.brand,
          model: vehicleBrandModel.model
        }
      },
      update: {},
      create: vehicleBrandModel,
    });
  }
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
