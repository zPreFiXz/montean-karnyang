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

const { authCheck } = require("../middlewares/auth");

// @ENDPOINTS http://localhost:3000/api/vehicle
// Methods GET
// ACCESS Private
router.get("/vehicle", authCheck, getAllVehicles);

// @ENDPOINTS http://localhost:3000/api/vehicle/1
// Methods GET
// ACCESS Private
router.get("/vehicle/:id", getVehicleById);

// @ENDPOINTS http://localhost:3000/api/vehicle
// Methods POST
// ACCESS Private
router.post("/vehicle", createVehicle);

// @ENDPOINTS http://localhost:3000/api/vehicle/1
// Methods PUT
// ACCESS Private
router.put("/vehicle", updateVehicle);

// @ENDPOINTS http://localhost:3000/api/vehicle/1
// Methods DELETE
// ACCESS Private
router.delete("/vehicle", deleteVehicle);

module.exports = router;
