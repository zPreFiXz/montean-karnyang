const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employee");

// @ENDPOINTS http://localhost:3000/api/employees
router.get("/employees", authCheck, getEmployees);

// @ENDPOINTS http://localhost:3000/api/employee
router.post("/employee", authCheck, createEmployee);

// @ENDPOINTS http://localhost:3000/api/employee/1
router.put("/employee/:id", authCheck, updateEmployee);

// @ENDPOINTS http://localhost:3000/api/employee/1
router.delete("/employee/:id", authCheck, deleteEmployee);

module.exports = router;
