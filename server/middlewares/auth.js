const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.authCheck = async (req, res, next) => {
  try {
    const headerToken = req.headers.authorization;

    if (!headerToken) {
      createError(401, "Unauthorized access. No token provided.");
    }

    const token = headerToken.split(" ")[1];
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decode;

    const user = await prisma.User.findFirst({
      where: { email: req.user.email },
    });

    next();
  } catch (error) {
    next(error);
  }
};

exports.adminCheck = async (req, res, next) => {
  try {
    const { email } = req.user;

    const adminUser = await prisma.User.findFirst({
      where: { email },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      createError(403, "Access denied. Admins only.");
    }

    next();
  } catch (error) {
    next(error);
  }
};
