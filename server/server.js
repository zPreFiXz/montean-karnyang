const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env"), quiet: true });

const REQUIRED_ENV = ["DATABASE_URL", "JWT_SECRET"];
const missingEnv = REQUIRED_ENV.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
  console.error(
    `Missing required environment variables: ${missingEnv.join(", ")}`,
  );
  process.exit(1);
}

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const { readdirSync, existsSync } = require("fs");
const handleError = require("./middlewares/error");
const app = express();

app.disable("x-powered-by");
app.use(
  helmet({
    // รันในวง LAN แบบ HTTP (ไม่มี SSL) จึงปิด HSTS ไม่งั้นเบราว์เซอร์บังคับ https แล้วโหลด asset ไม่ได้
    strictTransportSecurity: false,
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        // blob: จำเป็นสำหรับรูปตัวอย่างก่อนอัปโหลด (URL.createObjectURL) ไม่งั้นขึ้นแต่ alt text
        "img-src": ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
        // รันแบบ HTTP ล้วนในวง LAN จึงเอา directive นี้ออก ไม่งั้นเบราว์เซอร์อัป asset เป็น https แล้วโหลดไม่ได้
        "upgrade-insecure-requests": null,
      },
    },
  }),
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "5mb" }));
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(
  "/api/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณาลองใหม่ภายหลัง" },
  }),
);

const routesPath = path.join(__dirname, "routes");
readdirSync(routesPath)
  .sort()
  .forEach((file) => app.use("/api", require(path.join(routesPath, file))));

const clientDistPath = path.join(__dirname, "..", "client", "dist");
if (existsSync(clientDistPath)) {
  app.use(
    express.static(clientDistPath, {
      // ไฟล์ใน assets มี hash อยู่ในชื่อ เนื้อหาเปลี่ยนเมื่อไรชื่อก็เปลี่ยน จึง cache ยาวได้
      // ส่วน index.html ต้องถามใหม่ทุกครั้ง ไม่งั้นเครื่องที่ถือ HTML เก่าจะไล่ขอไฟล์ที่ถูกลบไปแล้ว
      setHeaders: (res, filePath) => {
        res.setHeader(
          "Cache-Control",
          filePath.endsWith("index.html") ? "no-cache" : "public, max-age=31536000, immutable",
        );
      },
    }),
  );

  // ส่ง index.html เฉพาะคำขอที่เป็นการ "เปิดหน้าเว็บ" เท่านั้น
  //
  // เดิมส่งให้ทุก path ที่ไม่ขึ้นต้นด้วย /api ทำให้ไฟล์ .js ที่หายไปตอน build ใหม่
  // ได้ HTML กลับไปพร้อมสถานะ 200 เบราว์เซอร์เอาไปรันเป็น JavaScript แล้วพังเป็นจอดำ
  // โดยไม่มี error ให้เห็น — ต้องปล่อยให้ตกไปเป็น 404 ตามความจริง
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    if (path.extname(req.path)) return next(); // มีนามสกุล = ขอไฟล์ ไม่ใช่เปิดหน้า
    if (!req.accepts("html")) return next();
    return res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.use((req, res) => {
  res.status(404).json({ message: "ไม่พบเส้นทางที่เรียกใช้งาน" });
});

app.use(handleError);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
