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
const { validate, vehicleBrandModelSchema } = require("../utils/validator");

// @ENDPOINTS http://localhost:3000/api/vehicle-brand-models
router.get("/vehicle-brand-models", authCheck, getVehicleBrandModels);

// @ENDPOINTS http://localhost:3000/api/vehicle-brand-model
router.post(
  "/vehicle-brand-model",
  authCheck,
  validate(vehicleBrandModelSchema),
  createVehicleBrandModel
);

// @ENDPOINTS http://localhost:3000/api/vehicle-brand-model/1
router.put(
  "/vehicle-brand-model/:id",
  authCheck,
  validate(vehicleBrandModelSchema),
  updateVehicleBrandModel
);

// @ENDPOINTS http://localhost:3000/api/vehicle-brand-model/1
router.delete("/vehicle-brand-model/:id", authCheck, deleteVehicleBrandModel);

module.exports = router;
