const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const createError = require("../utils/createError");

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!user) {
      createError(400, "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }

    const checkPassword = bcrypt.compareSync(password, user.password);

    if (!checkPassword) {
      createError(400, "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      message: "เข้าสู่ระบบเรียบร้อยแล้ว",
      payload: payload,
      token: token,
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res, next) => {
  try {
    // ระบบใช้ Bearer token ฝั่ง client เป็นคนทิ้ง token เอง endpoint นี้มีไว้ยืนยันการออกจากระบบ
    res.json({ message: "ออกจากระบบเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};

exports.currentUser = async (req, res, next) => {
  try {
    // authCheck ดึงข้อมูล user ล่าสุด (ไม่มี password) ใส่ req.user ให้แล้ว
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};
