const express = require("express");
const { register, login } = require("../controllers/auth");
const { registerSchema, validate } = require("../utils/validator");
const router = express.Router();

// @ENDPOINTS http://localhost:3000/api/auth/register
// Methods POST
// ACCESS Public
router.post("/auth/register", validate(registerSchema), register);

// @ENDPOINTS http://localhost:3000/api/auth/login
// Methods POST
// ACCESS Prublic
router.post("/auth/login", login);

module.exports = router;
