const express = require("express");
const { registerSchema, validate, loginSchema } = require("../utils/validator");
const router = express.Router();

// Middlewares
const { authCheck, adminCheck } = require("../middlewares/auth");

// Controllers
const { register, login, logout, currentUser } = require("../controllers/auth");

// @ENDPOINTS http://localhost:3000/api/register
router.post("/register", validate(registerSchema), register);

// @ENDPOINTS http://localhost:3000/api/login
router.post("/login", validate(loginSchema), login);

// @ENDPOINTS http://localhost:3000/api/logout
router.post("/logout", authCheck, logout);

// @ENDPOINTS http://localhost:3000/api/current-user
router.post("/current-user", authCheck, currentUser);

// @ENDPOINTS http://localhost:3000/api/current-admin
router.post("/current-admin", authCheck, adminCheck, currentUser);

module.exports = router;
