const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const {
  getVehicleBrandModels,
  createVehicleBrandModel,
  updateVehicleBrandModel,
  deleteVehicleBrandModel,
} = require("../controllers/vehicleBrandModel");

// @ENDPOINTS http://localhost:3000/api/vehicle-brand-models
router.get("/vehicle-brand-models", authCheck, getVehicleBrandModels);

// @ENDPOINTS http://localhost:3000/api/vehicle-brand-model
router.post("/vehicle-brand-model", authCheck, createVehicleBrandModel);

// @ENDPOINTS http://localhost:3000/api/vehicle-brand-model/1
router.put("/vehicle-brand-model/:id", authCheck, updateVehicleBrandModel);

// @ENDPOINTS http://localhost:3000/api/vehicle-brand-model
router.delete("/vehicle-brand-model/:id", authCheck, deleteVehicleBrandModel);

module.exports = router;
