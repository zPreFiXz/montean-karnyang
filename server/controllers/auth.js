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

    const user = await prisma.Employee.findFirst({
      where: {
        email: email,
      },
    });

    if (user) {
      createError(400, "User already exists");
    }

    const hashPassword = bcrypt.hashSync(password_hash, 10);

    const result = await prisma.Employee.create({
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

exports.login = (req, res, next) => {
  try {
    res.json({ message: "User logged in successfully" });
  } catch (error) {
    next(error);
  }
};
