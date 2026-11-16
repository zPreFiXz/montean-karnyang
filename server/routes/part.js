const express = require("express");
const router = express.Router();

const validate = require("../middlewares/validate");
const {
  partSchema,
  updatePartStockSchema,
  mergeBrandSchema,
} = require("../utils/schemas");

const { authCheck } = require("../middlewares/auth");

const {
  listParts,
  createPart,
  updatePart,
  updatePartStock,
  deletePart,
  listPartHints,
  listBrandVariants,
  mergeBrandVariants,
} = require("../controllers/part");

router.get("/parts", authCheck, listParts);
router.get("/parts/hints", authCheck, listPartHints);
router.get("/parts/brand-variants", authCheck, listBrandVariants);
router.post(
  "/parts/brand-variants/merge",
  authCheck,
  validate(mergeBrandSchema),
  mergeBrandVariants,
);
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
