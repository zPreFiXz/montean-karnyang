const express = require("express");
const { register, login } = require("../controllers/auth");
const { registerSchema, validate } = require("../utils/validator");

// Controllers
const router = express.Router();

// @ENDPOINTS http://localhost:3000/api/auth/register
// Methods POST
// ACCESS Private
router.post("/auth/register", validate(registerSchema), register);

// @ENDPOINTS http://localhost:3000/api/auth/login
// Methods POST
// ACCESS Private
router.post("/auth/login", login);

module.exports = router;
