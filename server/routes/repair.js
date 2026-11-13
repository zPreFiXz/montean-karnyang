const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const {
  repairSchema,
  updateRepairStatusSchema,
  repairDepositSchema,
  cancelRepairSchema,
} = require("../utils/schemas");

const { authCheck } = require("../middlewares/auth");

const {
  listRepairs,
  listChequeBanks,
  listDocumentNumbers,
  getRepair,
  createRepair,
  updateRepair,
  updateRepairStatus,
  deleteRepair,
  cancelRepair,
  setRepairDeposit,
  printRepairReceipt,
  renderRepairImages,
} = require("../controllers/repair");

router.get("/repairs", authCheck, listRepairs);
// ต้องอยู่ก่อน /repairs/:id ไม่งั้น cheque-banks กับ document-numbers ถูกจับเป็น id
router.get("/repairs/cheque-banks", authCheck, listChequeBanks);
router.get("/repairs/document-numbers", authCheck, listDocumentNumbers);
router.get("/repairs/:id", authCheck, getRepair);
router.post("/repairs", authCheck, validate(repairSchema), createRepair);
router.put("/repairs/:id", authCheck, validate(repairSchema), updateRepair);
router.delete("/repairs/:id", authCheck, deleteRepair);
router.patch(
  "/repairs/:id/cancel",
  authCheck,
  validate(cancelRepairSchema),
  cancelRepair,
);
router.patch(
  "/repairs/:id/deposit",
  authCheck,
  validate(repairDepositSchema),
  setRepairDeposit,
);
router.post("/repairs/:id/print", authCheck, printRepairReceipt);
router.post("/repairs/:id/image", authCheck, renderRepairImages);
router.patch(
  "/repairs/:id/status",
  authCheck,
  validate(updateRepairStatusSchema),
  updateRepairStatus,
);

module.exports = router;
