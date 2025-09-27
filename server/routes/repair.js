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

// @ENDPOINTS http://localhost:3000/api/repair/1
router.get("/repair/:id", authCheck, getRepairById);

// @ENDPOINTS http://localhost:3000/api/repair
router.post("/repair", authCheck, validate(repairSchema), createRepair);

// @ENDPOINTS http://localhost:3000/api/repair/1
router.put("/repair/:id", authCheck, validate(repairSchema), updateRepair);

// @ENDPOINTS http://localhost:3000/api/repair/1/status
router.patch("/repair/:id/status", authCheck, updateRepairStatus);

module.exports = router;
