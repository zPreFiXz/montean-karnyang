const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const {
  getVehicles,
  getVehicleById,
  getVehicleBrandModel,
} = require("../controllers/vehicle");

// @ENDPOINTS http://localhost:3000/api/vehicles
router.get("/vehicles", authCheck, getVehicles);

// @ENDPOINTS http://localhost:3000/api/vehicle/1
router.get("/vehicle/:id", authCheck, getVehicleById);

// @ENDPOINTS http://localhost:3000/api/vehicle-brand-models
router.get("/vehicle-brand-models", authCheck, getVehicleBrandModel);

module.exports = router;
