const express = require("express");
const router = express.Router();

// Controllers
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require("../controllers/vehicle");

// @ENDPOINTS   http://localhost:5000/api/vehicle
// Methods GET
// ACCESS Private
router.get("/vehicle", getAllVehicles);

// @ENDPOINTS   http://localhost:5000/api/vehicle/1
// Methods GET
// ACCESS Private
router.get("/vehicle/:id", getVehicleById);

// @ENDPOINTS   http://localhost:5000/api/vehicle
// Methods POST
// ACCESS Private
router.post("/vehicle", createVehicle);

// @ENDPOINTS   http://localhost:5000/api/vehicle/1
// Methods PUT
// ACCESS Private
router.post("/vehicle", updateVehicle);

// @ENDPOINTS   http://localhost:5000/api/vehicle/1
// Methods DELETE
// ACCESS Private
router.post("/vehicle", deleteVehicle);

module.exports = router;
