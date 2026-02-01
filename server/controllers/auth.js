const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.register = async (req, res, next) => {
  try {
    const { email, password, fullName, nickname, phoneNumber, dateOfBirth } =
      req.body;

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (user) {
      createError(400, "อีเมลนี้มีผู้ใช้งานแล้ว");
    }

    const hashPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword,
        fullName,
        nickname,
        phoneNumber,
        dateOfBirth: new Date(dateOfBirth),
      },
    });

    res.json({
      message: "สร้างบัญชีพนักงานเรียบร้อยแล้ว",
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      createError(400, "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }

    const checkPassword = await bcrypt.compare(password, user.passwordHash);

    if (!checkPassword) {
      createError(400, "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "เข้าสู่ระบบเรียบร้อยแล้ว",
      payload,
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res, next) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";

    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
    });

    res.json({ message: "ออกจากระบบเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};

exports.currentUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: req.user.email,
      },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
      },
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
};
