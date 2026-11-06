const express = require("express");
const router = express.Router();

const { authCheck } = require("../middlewares/auth");

const {
  getSuspensionTypeOrder,
  updateSuspensionTypeOrder,
} = require("../controllers/suspensionTypeOrder");

router.get("/suspension-type-order", authCheck, getSuspensionTypeOrder);
router.put("/suspension-type-order", authCheck, updateSuspensionTypeOrder);

module.exports = router;
