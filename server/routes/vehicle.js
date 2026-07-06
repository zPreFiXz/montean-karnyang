const express = require("express");
const router = express.Router();
const { validate, vehicleModelSchema } = require("../utils/validator");

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers (Vehicle Model)
const {
  listVehicleModels,
  createVehicleModel,
  updateVehicleModel,
  deleteVehicleModel,
} = require("../controllers/vehicleModel");

// Controllers (Vehicle)
const { listVehicles, getVehicle } = require("../controllers/vehicle");

router.get("/vehicles/models", authCheck, listVehicleModels);
router.post("/vehicles/models", authCheck, validate(vehicleModelSchema), createVehicleModel);
router.put("/vehicles/models/:id", authCheck, validate(vehicleModelSchema), updateVehicleModel);
router.delete("/vehicles/models/:id", authCheck, deleteVehicleModel);

router.get("/vehicles", authCheck, listVehicles);
router.get("/vehicles/:id", authCheck, getVehicle);

module.exports = router;
