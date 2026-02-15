const express = require("express");
const router = express.Router();
const {
  validate,
  createEmployeeSchema,
  editEmployeeSchema,
} = require("../utils/validator");

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

// @ENDPOINTS http://localhost:3000/api/employees
router.post(
  "/employees",
  authCheck,
  adminCheck,
  validate(createEmployeeSchema),
  createEmployee,
);

// @ENDPOINTS http://localhost:3000/api/employees/1
router.put(
  "/employees/:id",
  authCheck,
  adminCheck,
  validate(editEmployeeSchema),
  updateEmployee,
);

// @ENDPOINTS http://localhost:3000/api/employees/1
router.delete("/employees/:id", authCheck, adminCheck, deleteEmployee);

module.exports = router;
