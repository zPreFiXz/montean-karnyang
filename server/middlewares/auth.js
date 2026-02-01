const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.authCheck = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      createError(401, "กรุณาเข้าสู่ระบบก่อนใช้งาน");
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decode;

    await prisma.user.findUnique({
      where: { email: req.user.email },
    });

    next();
  } catch (error) {
    next(error);
  }
};

exports.adminCheck = async (req, res, next) => {
  try {
    const { email } = req.user;

    const adminUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      createError(403, "ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น");
    }

    next();
  } catch (error) {
    next(error);
  }
};
