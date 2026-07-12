const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// node-zklib เพิ่ม listener ต่อการ reconnect หนึ่งรอบ — ยกเพดานกัน warning ตอนต่อใหม่หลายครั้ง
require("events").EventEmitter.defaultMaxListeners = 20;

const { PrismaClient } = require("@prisma/client");
const { startZktecoService } = require("./zkteco/index");

const prisma = new PrismaClient();

const shutdown = async (stop) => {
  console.log("[ZKTeco] Shutting down gracefully...");

  // กันค้าง: ถ้าปิดไม่จบใน 5 วิ บังคับดับ
  const force = setTimeout(() => process.exit(1), 5_000);
  force.unref();

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
