const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const { vehicleModelSchema } = require("../utils/schemas");

const { authCheck } = require("../middlewares/auth");

const {
  listVehicleModels,
  createVehicleModel,
  updateVehicleModel,
  deleteVehicleModel,
  reorderVehicleModels,
} = require("../controllers/vehicleModel");

router.get("/vehicles/models", authCheck, listVehicleModels);
router.post(
  "/vehicles/models",
  authCheck,
  validate(vehicleModelSchema),
  createVehicleModel,
);
router.patch("/vehicles/models/reorder", authCheck, reorderVehicleModels);
router.put(
  "/vehicles/models/:id",
  authCheck,
  validate(vehicleModelSchema),
  updateVehicleModel,
);
router.delete("/vehicles/models/:id", authCheck, deleteVehicleModel);

module.exports = router;
