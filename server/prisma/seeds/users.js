const bcrypt = require("bcryptjs");

exports.users = [
  {
    email: process.env.ADMIN_EMAIL,
    passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12),
    role: "ADMIN",
    firstName: "มณเฑียร",
    lastName: "การยาง",
    nickname: "แอดมิน",
    dateOfBirth: new Date("1990-01-01"),
  },
];
