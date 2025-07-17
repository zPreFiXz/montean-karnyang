const express = require("express");
const { register, login } = require("../controllers/auth.controller");
const { registerSchema, validate, loginSchema } = require("../utils/validator");
const router = express.Router();

// @ENDPOINTS http://localhost:3000/api/auth/register
router.post("/auth/register", validate(registerSchema), register);

// @ENDPOINTS http://localhost:3000/api/auth/login
router.post("/auth/login", validate(loginSchema), login);

module.exports = router;
