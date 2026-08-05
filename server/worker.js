const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env"), quiet: true });

// prisma + node-zklib ผูก listener หลายตัวบน process/socket — ยกเพดานกัน warning "possible memory leak" หลอก
require("events").EventEmitter.defaultMaxListeners = 20;

const { PrismaClient } = require("@prisma/client");
const { startZktecoService } = require("./zkteco/index");
const { log } = require("./zkteco/log");

const prisma = new PrismaClient();

const shutdown = async (stop) => {
  log.info("Worker", "Shutting down gracefully...");

  // กันค้าง: ถ้า cleanup ไม่จบใน 5 วิ บังคับออก — unref ไม่ให้ตัว timer เองกันไม่ให้ process ปิด
  const forceExitTimer = setTimeout(() => process.exit(1), 5_000);
  forceExitTimer.unref();

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
    log.error("Worker", "Fatal:", err);
    process.exit(1);
  });
