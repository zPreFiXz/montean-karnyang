const express = require("express");
const { registerSchema, validate, loginSchema } = require("../utils/validator");
const router = express.Router();

// Middlewares
const { authCheck, adminCheck } = require("../middlewares/auth");

// Controllers
const {
  register,
  login,
  logout,
  currentUser,
} = require("../controllers/auth.controller");

// @ENDPOINTS http://localhost:3000/api/register
// METHOD POST
// ACCESS Public
router.post("/register", validate(registerSchema), register);

// @ENDPOINTS http://localhost:3000/api/login
// METHOD POST
// ACCESS Public
router.post("/login", validate(loginSchema), login);

// @ENDPOINTS http://localhost:3000/api/logout
// METHOD POST
// ACCESS Private
router.post("/logout", authCheck, logout);

// @ENDPOINTS http://localhost:3000/api/current-user
// METHOD POST
// ACCESS Private
router.post("/current-user", authCheck, currentUser);

// @ENDPOINTS http://localhost:3000/api/current-admin
// METHOD POST
// ACCESS Private
router.post("/current-admin", authCheck, adminCheck, currentUser);

module.exports = router;
