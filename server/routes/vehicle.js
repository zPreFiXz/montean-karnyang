const express = require("express");
const router = express.Router();
const { validate, vehicleBrandModelSchema } = require("../utils/validator");

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers (Vehicle Brand-Model)
const {
  getVehicleBrandModels,
  createVehicleBrandModel,
  updateVehicleBrandModel,
  deleteVehicleBrandModel,
} = require("../controllers/vehicleBrandModel");

// Controllers (Vehicle)
const { getVehicles, getVehicleById } = require("../controllers/vehicle");

// Brand-Models routes
// @ENDPOINTS http://localhost:3000/api/vehicles/brand-models
router.get("/vehicles/brand-models", authCheck, getVehicleBrandModels);

// @ENDPOINTS http://localhost:3000/api/vehicles/brand-models
router.post(
  "/vehicles/brand-models",
  authCheck,
  validate(vehicleBrandModelSchema),
  createVehicleBrandModel
);

// @ENDPOINTS http://localhost:3000/api/vehicles/brand-models/1
router.put(
  "/vehicles/brand-models/:id",
  authCheck,
  validate(vehicleBrandModelSchema),
  updateVehicleBrandModel
);

// @ENDPOINTS http://localhost:3000/api/vehicles/brand-models/1
router.delete("/vehicles/brand-models/:id", authCheck, deleteVehicleBrandModel);

// Vehicle routes
// @ENDPOINTS http://localhost:3000/api/vehicles
router.get("/vehicles", authCheck, getVehicles);

// @ENDPOINTS http://localhost:3000/api/vehicles/1
router.get("/vehicles/:id", authCheck, getVehicleById);

module.exports = router;
