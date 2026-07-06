const { PrismaClient } = require("@prisma/client");
const { categories } = require("./seeds/categories");
const { users } = require("./seeds/users");
const { services } = require("./seeds/services");
const { vehicleModels } = require("./seeds/vehicleModels");

const prisma = new PrismaClient();

async function main() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  for (const item of categories) {
    await prisma.category.upsert({
      where: { name: item.name },
      update: {},
      create: item,
    });
  }

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {},
      create: service,
    });
  }

  for (const vehicleModel of vehicleModels) {
    await prisma.vehicleModel.upsert({
      where: {
        brand_model: {
          brand: vehicleModel.brand,
          model: vehicleModel.model,
        },
      },
      update: {},
      create: vehicleModel,
    });
  }
}

main()
  .then(async () => {
    console.log("✅ Seed เรียบร้อยแล้ว");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
