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
  listParts,
  createPart,
  updatePart,
  updatePartStock,
  deletePart,
} = require("../controllers/part");

router.get("/parts", authCheck, listParts);
router.post("/parts", authCheck, validate(partSchema), createPart);
router.put("/parts/:id", authCheck, validate(partSchema), updatePart);
router.patch(
  "/parts/:id/stock",
  authCheck,
  validate(updatePartStockSchema),
  updatePartStock,
);
router.delete("/parts/:id", authCheck, deletePart);

module.exports = router;
