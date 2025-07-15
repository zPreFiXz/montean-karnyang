const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res, next) => {
  try {
    const { email, password_hash, first_name, last_name } = req.body;

    const user = await prisma.account.findFirst({
      where: {
        email: email,
      },
    });

    if (user) {
      createError(400, "User already exists");
    }

    const hashPassword = bcrypt.hashSync(password_hash, 10);

    const result = await prisma.account.create({
      data: {
        email: email,
        password_hash: hashPassword,
        first_name: first_name,
        last_name: last_name,
      },
    });

    console.log(result)

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
