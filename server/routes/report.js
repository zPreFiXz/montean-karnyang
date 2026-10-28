const express = require("express");
const router = express.Router();

const { authCheck, adminCheck } = require("../middlewares/auth");

const {
  listTopItems,
  listTopVehicleModels,
  getVehicleModelReport,
} = require("../controllers/report");

router.get("/reports/top-items", authCheck, adminCheck, listTopItems);
router.get(
  "/reports/top-vehicle-models",
  authCheck,
  adminCheck,
  listTopVehicleModels,
);
router.get(
  "/reports/top-vehicle-models/:id",
  authCheck,
  adminCheck,
  getVehicleModelReport,
);

module.exports = router;
