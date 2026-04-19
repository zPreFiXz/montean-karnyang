const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("events").EventEmitter.defaultMaxListeners = 0;

const { PrismaClient } = require("@prisma/client");
const { startZktecoListener } = require("./zkteco/listener");

const prisma = new PrismaClient();
startZktecoListener(prisma);
