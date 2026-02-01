const express = require("express");
const router = express.Router();
const { validate, repairSchema } = require("../utils/validator");

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const {
  getRepairs,
  getRepairById,
  createRepair,
  updateRepair,
  updateRepairStatus,
} = require("../controllers/repair");

// @ENDPOINTS http://localhost:3000/api/repairs
router.get("/repairs", authCheck, getRepairs);

// @ENDPOINTS http://localhost:3000/api/repairs/1
router.get("/repairs/:id", authCheck, getRepairById);

// @ENDPOINTS http://localhost:3000/api/repairs
router.post("/repairs", authCheck, validate(repairSchema), createRepair);

// @ENDPOINTS http://localhost:3000/api/repairs/1
router.put("/repairs/:id", authCheck, validate(repairSchema), updateRepair);

// @ENDPOINTS http://localhost:3000/api/repairs/1/status
router.patch("/repairs/:id/status", authCheck, updateRepairStatus);

module.exports = router;
