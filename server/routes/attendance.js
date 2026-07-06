const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck, adminCheck } = require("../middlewares/auth");

// Controllers
const { getAttendanceSummary } = require("../controllers/attendance");

router.get("/attendances/summary", authCheck, adminCheck, getAttendanceSummary);

module.exports = router;
