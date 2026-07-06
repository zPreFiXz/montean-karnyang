const bcrypt = require("bcryptjs");

exports.users = [
  {
    email: process.env.ADMIN_EMAIL,
    password: bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10),
    role: "ADMIN",
    name: "มณเฑียรการยาง",
  },
];
