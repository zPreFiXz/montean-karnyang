const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const createError = require("../utils/createError");
const { nextSessionExpiry } = require("../utils/sessionExpiry");

exports.login = async (req, res) => {
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

  const expiresAt = nextSessionExpiry();
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
  });

  res.json({
    message: "เข้าสู่ระบบเรียบร้อยแล้ว",
    payload: payload,
    token: token,
  });
};

exports.logout = (req, res) => {
  // ระบบใช้ Bearer token ฝั่ง client เป็นคนทิ้ง token เอง endpoint นี้มีไว้ยืนยันการออกจากระบบ
  res.json({ message: "ออกจากระบบเรียบร้อยแล้ว" });
};

exports.currentUser = async (req, res) => {
  res.json(req.user);
};
