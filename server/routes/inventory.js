const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const { getInventory } = require("../controllers/inventory");

// @ENDPOINTS http://localhost:3000/api/inventory
router.get("/inventory", authCheck, getInventory);

module.exports = router;
