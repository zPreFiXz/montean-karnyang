const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const { listInventory, getInventory } = require("../controllers/inventory");

router.get("/inventory", authCheck, listInventory);
router.get("/inventory/:id", authCheck, getInventory);

module.exports = router;
