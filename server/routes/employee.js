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
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employee");

router.get("/employees", authCheck, adminCheck, listEmployees);
router.post(
  "/employees",
  authCheck,
  adminCheck,
  validate(createEmployeeSchema),
  createEmployee,
);
router.put(
  "/employees/:id",
  authCheck,
  adminCheck,
  validate(editEmployeeSchema),
  updateEmployee,
);
router.delete("/employees/:id", authCheck, adminCheck, deleteEmployee);

module.exports = router;
