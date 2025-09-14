const express = require("express");
const router = express.Router();
const {
  validate,
  createRepairSchema,
  updateRepairSchema,
} = require("../utils/validator");

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const {
  getRepairs,
  getRepairById,
  createRepair,
  updateRepair,
  deleteRepair,
  updateRepairStatus,
} = require("../controllers/repair");

// @ENDPOINTS http://localhost:3000/api/repairs
router.get("/repairs", authCheck, getRepairs);

// @ENDPOINTS http://localhost:3000/api/repair/1
router.get("/repair/:id", authCheck, getRepairById);

// @ENDPOINTS http://localhost:3000/api/repair
router.post("/repair", authCheck, validate(createRepairSchema), createRepair);

// @ENDPOINTS http://localhost:3000/api/repair/1
router.put(
  "/repair/:id",
  authCheck,
  validate(updateRepairSchema),
  updateRepair
);

// @ENDPOINTS http://localhost:3000/api/repair/1/status
router.patch("/repair/:id/status", authCheck, updateRepairStatus);

// @ENDPOINTS http://localhost:3000/api/repair/1
router.delete("/repair/id", authCheck, deleteRepair);

module.exports = router;
