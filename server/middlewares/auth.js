const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.authCheck = async (req, res, next) => {
  try {
    const headerToken = req.headers.authorization;

    if (!headerToken || !headerToken.startsWith("Bearer ")) {
      createError(401, "กรุณาเข้าสู่ระบบก่อนใช้งาน");
    }

    const token = headerToken.slice("Bearer ".length);

    const decode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decode;

    // เช็คว่าบัญชียังมีอยู่จริง (เผื่อถูกลบหลังออก token) และใช้ role ล่าสุดจาก DB
    const user = await prisma.user.findUnique({
      where: { email: req.user.email },
      select: { id: true, email: true, role: true, name: true },
    });

    if (!user) {
      createError(401, "ไม่พบบัญชีผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
    }

    req.user = user;

    next();
  } catch (error) {
    // token หมดอายุ/ปลอม → ตอบ 401 พร้อมข้อความเข้าใจง่าย แทน error ดิบ
    if (error.name === "TokenExpiredError") {
      error.code = 401;
      error.message = "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่";
    } else if (error.name === "JsonWebTokenError") {
      error.code = 401;
      error.message = "กรุณาเข้าสู่ระบบใหม่";
    }
    next(error);
  }
};

exports.adminCheck = (req, res, next) => {
  try {
    // authCheck ดึง user (พร้อม role ล่าสุด) จาก DB ไว้ใน req.user แล้ว ไม่ต้อง query ซ้ำ
    if (!req.user || req.user.role !== "ADMIN") {
      createError(403, "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้");
    }

    next();
  } catch (error) {
    next(error);
  }
};
