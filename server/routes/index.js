const express = require("express");

const router = express.Router();

// vehicleModel ต้องมาก่อน vehicle ไม่งั้น GET /vehicles/models จะถูก /vehicles/:id จับไปก่อน
const routes = [
  "attendance",
  "auth",
  "category",
  "image",
  "customer",
  "employee",
  "inventory",
  "part",
  "repair",
  "report",
  "service",
  "user",
  "vehicleModel",
  "vehicle",
];

routes.forEach((name) => router.use(require(`./${name}`)));

module.exports = router;
