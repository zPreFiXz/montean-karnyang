const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const {
  getCategories,
  createCategory,
  deleteCategory,
} = require("../controllers/category.controller");

// @ENDPOINTS http://localhost:3000/api/categories
// METHOD GET
// ACCESS Private
router.get("/categories", authCheck, getCategories);

// @ENDPOINTS http://localhost:3000/api/category
// METHOD POST
// ACCESS Private
router.post("/category", authCheck, createCategory);

// @ENDPOINTS http://localhost:3000/api/category/1
// METHOD DELETE
// ACCESS Private
router.delete("/category/:id", authCheck, deleteCategory);

module.exports = router;
