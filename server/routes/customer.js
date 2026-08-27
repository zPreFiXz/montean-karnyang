const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const { listCustomers } = require("../controllers/customer");

router.get("/customers", authCheck, listCustomers);

module.exports = router;
