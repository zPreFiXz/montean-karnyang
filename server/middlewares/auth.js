const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const { passwordFingerprint } = require("../utils/passwordFingerprint");

exports.authCheck = async (req, res, next) => {
  try {
    const headerToken = req.headers.authorization;

    if (!headerToken || !headerToken.startsWith("Bearer ")) {
      createError(401, "กรุณาเข้าสู่ระบบก่อนใช้งาน");
    }

    const token = headerToken.slice("Bearer ".length);

    const decode = jwt.verify(token, process.env.JWT_SECRET);

    // เช็คว่าบัญชียังมีอยู่จริง (เผื่อถูกลบหลังออก token) และใช้ role ล่าสุดจาก DB
    // หาจาก id แล้วเทียบอีเมลซ้ำ ลบบัญชีแล้วสร้างใหม่ด้วยอีเมลเดิม token ของคนเก่าจะใช้ไม่ได้
    const user = await prisma.user.findUnique({
      where: { id: Number(decode.id) || 0 },
      select: { id: true, email: true, role: true, name: true, password: true },
    });

    if (!user || user.email !== decode.email) {
      createError(401, "ไม่พบบัญชีผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่");
    }

    // token รุ่นก่อนยังไม่มีลายนิ้วมือ ให้เข้าสู่ระบบใหม่ครั้งเดียว ไม่ใช่เพราะรหัสถูกเปลี่ยน
    if (!decode.pv) {
      createError(401, "กรุณาเข้าสู่ระบบใหม่");
    }
    // เปลี่ยนรหัสผ่านแล้ว token ที่ออกด้วยรหัสเดิมใช้ไม่ได้
    if (decode.pv !== passwordFingerprint(user.password)) {
      createError(401, "รหัสผ่านถูกเปลี่ยน กรุณาเข้าสู่ระบบใหม่");
    }

    const { password: _password, ...safeUser } = user;
    req.user = safeUser;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      error.code = 401;
      error.message = "หมดเวลาการใช้งาน กรุณาเข้าสู่ระบบใหม่";
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
