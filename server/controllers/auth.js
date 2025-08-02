const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, nickname, dateOfBirth } =
      req.body;

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (user) {
      createError(400, "อีเมลนี้ถูกใช้งานแล้ว");
    }

    const hashPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword,
        firstName,
        lastName,
        nickname,
        dateOfBirth,
      },
    });

    res.json({
      message: "สร้างบัญชีพนักงานสำเร็จ",
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
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      payload,
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res, next) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.json({ message: "ออกจากระบบสำเร็จ" });
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
        firstName: true,
        lastName: true,
      },
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
};
