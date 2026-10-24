const express = require("express");
const router = express.Router();

const { authCheck, adminCheck } = require("../middlewares/auth");

const { listTopItems, listTopVehicleModels } = require("../controllers/report");

router.get("/reports/top-items", authCheck, adminCheck, listTopItems);
router.get(
  "/reports/top-vehicle-models",
  authCheck,
  adminCheck,
  listTopVehicleModels,
);

module.exports = router;
