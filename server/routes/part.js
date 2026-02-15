const express = require("express");
const router = express.Router();
const {
  partSchema,
  validate,
  updatePartStockSchema,
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

// @ENDPOINTS http://localhost:3000/api/parts
router.get("/parts", authCheck, getParts);

// @ENDPOINTS http://localhost:3000/api/parts
router.post("/parts", authCheck, validate(partSchema), createPart);

// @ENDPOINTS http://localhost:3000/api/parts/1
router.put("/parts/:id", authCheck, validate(partSchema), updatePart);

// @ENDPOINTS http://localhost:3000/api/parts/1/stock
router.patch(
  "/parts/:id/stock",
  authCheck,
  validate(updatePartStockSchema),
  addStock,
);

// @ENDPOINTS http://localhost:3000/api/parts/1
router.delete("/parts/:id", authCheck, deletePart);

module.exports = router;
