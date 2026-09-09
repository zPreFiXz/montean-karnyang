const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const {
  listInventory,
  getInventory,
  listInventoryRepairs,
} = require("../controllers/inventory");

router.get("/inventory", authCheck, listInventory);
// วางก่อน "/inventory/:id" ไม่งั้นคำว่า part/service จะถูกจับเป็น id
router.get("/inventory/:type/:id/repairs", authCheck, listInventoryRepairs);
router.get("/inventory/:id", authCheck, getInventory);

module.exports = router;
