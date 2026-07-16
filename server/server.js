const dotenv = require("dotenv");
dotenv.config();

// ตรวจสอบ env ที่จำเป็นก่อนเริ่มเซิร์ฟเวอร์
const REQUIRED_ENV = ["DATABASE_URL", "JWT_SECRET"];
const missingEnv = REQUIRED_ENV.filter((name) => !process.env[name]);
if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const path = require("path");
const { readdirSync, existsSync } = require("fs");
const handleError = require("./middlewares/error");

const app = express();
app.disable("x-powered-by");

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        // อนุญาตรูปจาก Cloudinary (ค่า default อนุญาตแค่ 'self' กับ data:)
        "img-src": ["'self'", "data:", "https://res.cloudinary.com"],
      },
    },
  })
);
// จำกัด origin ตาม CLIENT_URL กันเว็บอื่นยิง API ข้ามโดเมน
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(morgan("dev"));
// จำกัดขนาด body ให้พอสำหรับรูป base64 ที่ resize ฝั่ง client แล้ว
app.use(express.json({ limit: "5mb" }));

// กันยิง API ถี่ผิดปกติ และกัน brute-force รหัสผ่านที่ /login
app.use(
  "/api",
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: true, legacyHeaders: false })
);
app.use(
  "/api/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณาลองใหม่ภายหลัง" },
  })
);

// Routing: mount ตามลำดับชื่อไฟล์ (sort ให้แน่นอน — vehicle-model ต้องมาก่อน vehicle
// ไม่งั้น GET /vehicles/:id จะดักเส้นทาง /vehicles/models)
readdirSync("./routes")
  .sort()
  .forEach((file) => app.use("/api", require("./routes/" + file)));

// เสิร์ฟหน้าเว็บ (client ที่ build แล้ว) จาก server เดียวกัน — ใช้ตอน deploy ที่ร้าน
// dev ไม่กระทบ: ถ้าไม่มีโฟลเดอร์ dist ก็ข้ามส่วนนี้ไป (client รันผ่าน Vite แยกอยู่แล้ว)
const clientDistPath = path.join(__dirname, "..", "client", "dist");
if (existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // SPA fallback: ทุก GET ที่ไม่ใช่ /api ให้ตอบ index.html (react-router จัดการ path ต่อเอง)
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
      return res.sendFile(path.join(clientDistPath, "index.html"));
    }
    next();
  });
}

// 404 สำหรับ path ที่ไม่มีในระบบ
app.use((req, res) => {
  res.status(404).json({ message: "ไม่พบเส้นทางที่เรียกใช้งาน" });
});

// Error handling
app.use(handleError);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
