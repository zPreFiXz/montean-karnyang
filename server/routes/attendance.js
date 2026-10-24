const express = require("express");
const router = express.Router();

const { authCheck, adminCheck } = require("../middlewares/auth");

const { getAttendanceSummary } = require("../controllers/attendance");

router.get("/attendances/summary", authCheck, adminCheck, getAttendanceSummary);

module.exports = router;
