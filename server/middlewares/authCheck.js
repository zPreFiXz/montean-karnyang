const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

exports.authCheck = async (req, res, next) => {
  try {
    const headerToken = req.headers.authorization;

    if (!headerToken || !headerToken.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized access" });
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
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  } catch (error) {
    next(error);
  }
};
