const express = require("express");
const router = express.Router();
const { validate, vehicleBrandSchema } = require("../utils/validator");

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const {
  getVehicleBrands,
  createVehicleBrand,
  updateVehicleBrand,
  deleteVehicleBrand,
} = require("../controllers/vehicleBrand");

// @ENDPOINTS http://localhost:3000/api/vehicles/brands
router.get("/vehicles/brands", authCheck, getVehicleBrands);

// @ENDPOINTS http://localhost:3000/api/vehicles/brands
router.post(
  "/vehicles/brands",
  authCheck,
  validate(vehicleBrandSchema),
  createVehicleBrand,
);

// @ENDPOINTS http://localhost:3000/api/vehicles/brands/1
router.put(
  "/vehicles/brands/:id",
  authCheck,
  validate(vehicleBrandSchema),
  updateVehicleBrand,
);

// @ENDPOINTS http://localhost:3000/api/vehicles/brands/1
router.delete("/vehicles/brands/:id", authCheck, deleteVehicleBrand);

module.exports = router;
