const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const { printReceipt } = require("../controllers/print");

// @ENDPOINTS http://localhost:3000/api/prints/1
router.post("/prints/:id", authCheck, printReceipt);

module.exports = router;
