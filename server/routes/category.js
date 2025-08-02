const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const {
  getCategories,
  createCategory,
  deleteCategory,
} = require("../controllers/category");

// @ENDPOINTS http://localhost:3000/api/categories
router.get("/categories", authCheck, getCategories);

// @ENDPOINTS http://localhost:3000/api/category
router.post("/category", authCheck, createCategory);

// @ENDPOINTS http://localhost:3000/api/category/1
router.delete("/category/:id", authCheck, deleteCategory);

module.exports = router;
