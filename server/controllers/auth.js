const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const createError = require("../utils/createError");
const { nextSessionExpiry } = require("../utils/sessionExpiry");
const { passwordFingerprint } = require("../utils/passwordFingerprint");

// อีเมลไม่มีในระบบก็ยังเทียบรหัสกับค่าหลอก เวลาตอบจะเท่ากับรหัสผิด เดาอีเมลจากเวลาไม่ได้
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });

  // compare แบบ async ไม่บล็อกคำขออื่นระหว่างคำนวณ
  const checkPassword = await bcrypt.compare(
    password,
    user?.password || DUMMY_HASH,
  );

  if (!user || !checkPassword) {
    createError(400, "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const expiresAt = nextSessionExpiry();
  const token = jwt.sign(
    { ...payload, pv: passwordFingerprint(user.password) },
    process.env.JWT_SECRET,
    {
      expiresIn: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    },
  );

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
