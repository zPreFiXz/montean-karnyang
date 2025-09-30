const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck, adminCheck } = require("../middlewares/auth");

// Controllers
const {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employee");

// @ENDPOINTS http://localhost:3000/api/employees
router.get("/employees", authCheck, adminCheck, getEmployees);

// @ENDPOINTS http://localhost:3000/api/employee
router.post("/employee", authCheck, adminCheck, createEmployee);

// @ENDPOINTS http://localhost:3000/api/employee/1
router.put("/employee/:id", authCheck, adminCheck, updateEmployee);

// @ENDPOINTS http://localhost:3000/api/employee/1
router.delete("/employee/:id", authCheck, adminCheck, deleteEmployee);

module.exports = router;
