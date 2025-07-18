const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res, next) => {
  try {
    const {
      email,
      password_hash,
      first_name,
      last_name,
      nickname,
      date_of_birth,
    } = req.body;

    const user = await prisma.User.findFirst({
      where: {
        email: email,
      },
    });

    if (user) {
      createError(400, "User already exists");
    }

    const hashPassword = bcrypt.hashSync(password_hash, 10);

    const result = await prisma.User.create({
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
    const { email, password_hash } = req.body;

    const user = await prisma.User.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      createError(400, "Invalid email or password");
    }

    const checkPassword = bcrypt.compareSync(password_hash, user.password_hash);

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

    res.json({
      message: "User logged in successfully",
      payload,
      token,
    });
  } catch (error) {
    next(error);
  }
};
