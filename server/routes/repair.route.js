const express = require("express");
const router = express.Router();

// Controllers
const {
  getRepairs,
  getRepairById,
  createRepair,
  updateRepair,
  deleteRepair,
} = require("../controllers/repair.controller");

const { authCheck } = require("../middlewares/authCheck");

// @ENDPOINTS http://localhost:3000/api/repairs
// METHOD GET
// ACCESS Private
router.get("/repairs", authCheck, getRepairs);

// @ENDPOINTS http://localhost:3000/api/repair/1
// METHOD GET
// ACCESS Private
router.get("/repair/:id", authCheck, getRepairById);

// @ENDPOINTS http://localhost:3000/api/repair
// METHOD POST
// ACCESS Private
router.post("/repair", authCheck, createRepair);

// @ENDPOINTS http://localhost:3000/api/repair/1
// METHOD PUT
// ACCESS Private
router.put("/repair/:id", authCheck, updateRepair);

// @ENDPOINTS http://localhost:3000/api/repair/1
// METHOD DELETE
// ACCESS Private
router.delete("/repair/id", authCheck, deleteRepair);

module.exports = router;
