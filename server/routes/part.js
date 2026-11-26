const express = require("express");
const router = express.Router();

const validate = require("../middlewares/validate");
const {
  partSchema,
  updatePartStockSchema,
  partLabelSchema,
  partLabelPrintSchema,
} = require("../utils/schemas");

const { authCheck } = require("../middlewares/auth");

const {
  listParts,
  createPart,
  updatePart,
  updatePartStock,
  deletePart,
  listPartHints,
  previewPartLabel,
  printPartLabel,
} = require("../controllers/part");

router.get("/parts", authCheck, listParts);
router.get("/parts/hints", authCheck, listPartHints);
router.post("/parts", authCheck, validate(partSchema), createPart);
router.put("/parts/:id", authCheck, validate(partSchema), updatePart);
router.patch(
  "/parts/:id/stock",
  authCheck,
  validate(updatePartStockSchema),
  updatePartStock,
);
router.post(
  "/parts/:id/label/preview",
  authCheck,
  validate(partLabelSchema),
  previewPartLabel,
);
router.post(
  "/parts/:id/label/print",
  authCheck,
  validate(partLabelPrintSchema),
  printPartLabel,
);
router.delete("/parts/:id", authCheck, deletePart);

module.exports = router;
