const express = require("express");
const router = express.Router();

const { authCheck, adminCheck } = require("../middlewares/auth");
const { getDailyAttendanceSummary } = require("../controllers/attendance");

router.get(
  "/attendance/daily-summary",
  authCheck,
  adminCheck,
  getDailyAttendanceSummary,
);

module.exports = router;
