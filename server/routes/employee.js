const express = require("express");
const router = express.Router();

const validate = require("../middlewares/validate");
const { employeeSchema } = require("../utils/schemas");

const { authCheck, adminCheck } = require("../middlewares/auth");

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
  validate(employeeSchema),
  createEmployee,
);
router.put(
  "/employees/:id",
  authCheck,
  adminCheck,
  validate(employeeSchema),
  updateEmployee,
);
router.delete("/employees/:id", authCheck, adminCheck, deleteEmployee);

module.exports = router;
