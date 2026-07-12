const express = require("express");
const router = express.Router();

const { validate, categorySchema } = require("../utils/validator");

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const {
  listCategories,
  createCategory,
  deleteCategory,
} = require("../controllers/category");

router.get("/categories", authCheck, listCategories);
router.post("/categories", authCheck, validate(categorySchema), createCategory);
router.delete("/categories/:id", authCheck, deleteCategory);

module.exports = router;
