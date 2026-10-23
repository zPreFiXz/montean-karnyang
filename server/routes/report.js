const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck, adminCheck } = require("../middlewares/auth");

// Controllers
const { listTopItems, listTopVehicleModels } = require("../controllers/report");

// รายงานดูได้เฉพาะแอดมิน เหมือนหน้ารายงานยอดขาย
router.get("/reports/top-items", authCheck, adminCheck, listTopItems);
router.get(
  "/reports/top-vehicle-models",
  authCheck,
  adminCheck,
  listTopVehicleModels,
);

module.exports = router;
