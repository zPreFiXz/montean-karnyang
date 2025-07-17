const express = require("express");
const router = express.Router();

// Controllers
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require("../controllers/vehicle.controller");

const { authCheck } = require("../middlewares/authCheck");

// @ENDPOINTS http://localhost:3000/api/vehicle
router.get("/vehicle", authCheck, getAllVehicles);

// @ENDPOINTS http://localhost:3000/api/vehicle/1
router.get("/vehicle/:id", authCheck, getVehicleById);

// @ENDPOINTS http://localhost:3000/api/vehicle
router.post("/vehicle", authCheck, createVehicle);

// @ENDPOINTS http://localhost:3000/api/vehicle/1
router.put("/vehicle", authCheck, updateVehicle);

// @ENDPOINTS http://localhost:3000/api/vehicle/1
router.delete("/vehicle", authCheck, deleteVehicle);

module.exports = router;
