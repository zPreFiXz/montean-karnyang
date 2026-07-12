const express = require("express");
const router = express.Router();
const {
  validate,
  repairSchema,
  updateRepairStatusSchema,
} = require("../utils/validator");

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const {
  listRepairs,
  getRepair,
  createRepair,
  updateRepair,
  updateRepairStatus,
} = require("../controllers/repair");

router.get("/repairs", authCheck, listRepairs);
router.get("/repairs/:id", authCheck, getRepair);
router.post("/repairs", authCheck, validate(repairSchema), createRepair);
router.put("/repairs/:id", authCheck, validate(repairSchema), updateRepair);
router.patch(
  "/repairs/:id/status",
  authCheck,
  validate(updateRepairStatusSchema),
  updateRepairStatus,
);

module.exports = router;
