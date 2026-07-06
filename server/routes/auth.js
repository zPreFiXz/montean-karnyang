const express = require("express");
const router = express.Router();
const { validate, loginSchema } = require("../utils/validator");

// Middlewares
const { authCheck, adminCheck } = require("../middlewares/auth");

// Controllers
const { login, logout, currentUser } = require("../controllers/auth");

router.post("/login", validate(loginSchema), login);
router.post("/logout", authCheck, logout);
router.get("/current-user", authCheck, currentUser);
router.get("/current-admin", authCheck, adminCheck, currentUser);

module.exports = router;
