const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("events").EventEmitter.defaultMaxListeners = 20;

const { PrismaClient } = require("@prisma/client");
const { startZktecoService } = require("./zkteco/index");

const prisma = new PrismaClient();

const shutdown = async (stop) => {
  console.log("[ZKTeco] Shutting down gracefully...");
  stop?.();
  await prisma.$disconnect();
  process.exit(0);
};

startZktecoService(prisma)
  .then((stop) => {
    process.once("SIGTERM", () => shutdown(stop));
    process.once("SIGINT", () => shutdown(stop));
  })
  .catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
