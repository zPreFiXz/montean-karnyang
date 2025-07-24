const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, nickname, date_of_birth } =
      req.body;

    const user = await prisma.User.findUnique({
      where: {
        email: email,
      },
    });

    if (user) {
      createError(400, "User already exists");
    }

    const hashPassword = await bcrypt.hash(password, 12);

    await prisma.User.create({
      data: {
        email,
        password_hash: hashPassword,
        first_name,
        last_name,
        nickname,
        date_of_birth,
      },
    });

    res.json({ message: "User registered successfully" });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.User.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      createError(400, "Invalid email or password");
    }

    const checkPassword = await bcrypt.compare(password, user.password_hash);

    if (!checkPassword) {
      createError(400, "Invalid email or password");
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
      message: "Login successful",
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

    res.json({ message: "Logout successful" });
  } catch (error) {
    next(error);
  }
};

exports.currentUser = async (req, res, next) => {
  try {
    const user = await prisma.User.findUnique({
      where: {
        email: req.user.email,
      },
      select: {
        id: true,
        email: true,
        role: true,
        first_name: true,
        last_name: true,
      },
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
};
