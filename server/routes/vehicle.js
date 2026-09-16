const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const {
  listVehicles,
  lookupVehicleByPlate,
  getVehicle,
  deleteVehicle,
} = require("../controllers/vehicle");

router.get("/vehicles", authCheck, listVehicles);
// ต้องมาก่อน "/vehicles/:id" ไม่งั้น lookup จะถูกอ่านเป็นไอดี
router.get("/vehicles/lookup", authCheck, lookupVehicleByPlate);
router.get("/vehicles/:id", authCheck, getVehicle);
router.delete("/vehicles/:id", authCheck, deleteVehicle);

module.exports = router;
