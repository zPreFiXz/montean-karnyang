const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const { getCategories } = require("../controllers/category");

// @ENDPOINTS http://localhost:3000/api/categories
router.get("/categories", authCheck, getCategories);

module.exports = router;
