const express = require("express");
const router = express.Router();

const { authCheck } = require("../middlewares/auth");

const {
  listInventory,
  getInventory,
  listInventoryRepairs,
  listUnits,
  listMissingUnitItems,
  countMissingUnitItems,
} = require("../controllers/inventory");

router.get("/inventory", authCheck, listInventory);
// วางก่อน "/inventory/:id" ไม่งั้นคำว่า units กับ missing-units จะถูกจับเป็น id
router.get("/inventory/units", authCheck, listUnits);
router.get("/inventory/missing-units", authCheck, listMissingUnitItems);
router.get("/inventory/missing-units/count", authCheck, countMissingUnitItems);
// วางก่อน "/inventory/:id" ไม่งั้นคำว่า part/service จะถูกจับเป็น id
router.get("/inventory/:type/:id/repairs", authCheck, listInventoryRepairs);
router.get("/inventory/:id", authCheck, getInventory);

module.exports = router;
