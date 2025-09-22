const express = require("express");
const router = express.Router();
const {
  partSchema,
  validate,
  addStockSchema,
} = require("../utils/validator");

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const {
  getParts,
  createPart,
  updatePart,
  deletePart,
  addStock,
} = require("../controllers/part");

// @ENDPOINTS http://localhost:3000/api/part
router.get("/parts", authCheck, getParts);

// @ENDPOINTS http://localhost:3000/api/part
router.post("/part", authCheck, validate(partSchema), createPart);

// @ENDPOINTS http://localhost:3000/api/part/1
router.put(
  "/part/:id",
  authCheck,
  validate(partSchema),
  updatePart
);

// @ENDPOINTS http://localhost:3000/api/part/1/add-stock
router.patch(
  "/part/:id/add-stock",
  authCheck,
  validate(addStockSchema),
  addStock
);

// @ENDPOINTS http://localhost:3000/api/part/1
router.delete("/part/:id", authCheck, deletePart);

module.exports = router;
