const express = require("express");
const router = express.Router();

const { authCheck } = require("../middlewares/auth");

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
