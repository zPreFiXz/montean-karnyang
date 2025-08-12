const express = require("express");
const router = express.Router();
const { validate, createRepairSchema } = require("../utils/validator");

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const {
  getRepairs,
  getRepairById,
  createRepair,
  updateRepair,
  deleteRepair,
} = require("../controllers/repair");

// @ENDPOINTS http://localhost:3000/api/repairs
router.get("/repairs", authCheck, getRepairs);

// @ENDPOINTS http://localhost:3000/api/repair/1
router.get("/repair/:id", authCheck, getRepairById);

// @ENDPOINTS http://localhost:3000/api/repair
router.post("/repair", authCheck, validate(createRepairSchema), createRepair);

// @ENDPOINTS http://localhost:3000/api/repair/1
router.put("/repair/:id", authCheck, updateRepair);

// @ENDPOINTS http://localhost:3000/api/repair/1
router.delete("/repair/id", authCheck, deleteRepair);

module.exports = router;
