const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const { listVehicles, getVehicle } = require("../controllers/vehicle");

router.get("/vehicles", authCheck, listVehicles);
router.get("/vehicles/:id", authCheck, getVehicle);

module.exports = router;
