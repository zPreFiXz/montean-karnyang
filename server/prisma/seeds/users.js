const bcrypt = require("bcryptjs");

exports.users = [
  {
    email: process.env.ADMIN_EMAIL,
    passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12),
    role: "ADMIN",
    fullName: "มณเฑียรการยาง",
    nickname: "แอดมิน",
    phoneNumber: process.env.ADMIN_PHONE_NUMBER,
    dateOfBirth: new Date("1990-01-01"),
  },
];
