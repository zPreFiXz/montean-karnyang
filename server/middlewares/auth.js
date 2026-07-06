const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.authCheck = async (req, res, next) => {
  try {
    const headerToken = req.headers.authorization;

    if (!headerToken) {
      createError(401, "กรุณาเข้าสู่ระบบก่อนใช้งาน");
    }

    const token = headerToken.split(" ")[1];

    const decode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decode;

    // เช็คว่าบัญชียังมีอยู่จริง (เผื่อถูกลบหลังออก token)
    const user = await prisma.user.findFirst({
      where: { email: req.user.email },
    });

    if (!user) {
      createError(401, "ไม่พบบัญชีผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
    }

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

exports.adminCheck = async (req, res, next) => {
  try {
    const { email } = req.user;

    const adminUser = await prisma.user.findFirst({
      where: { email: email },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      createError(403, "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้");
    }

    next();
  } catch (error) {
    next(error);
  }
};
