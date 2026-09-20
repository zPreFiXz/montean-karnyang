const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const {
  listCustomers,
  updateCustomerOrganizationType,
  listOrganizations,
  listOrganizationRepairs,
  printOrganizationBill,
} = require("../controllers/customer");

router.get("/customers", authCheck, listCustomers);
// ต้องมาก่อน "/customers/:id" ไม่งั้น organizations จะถูกอ่านเป็นไอดี
router.get("/customers/organizations", authCheck, listOrganizations);
router.get(
  "/customers/organizations/:id/repairs",
  authCheck,
  listOrganizationRepairs,
);
router.post(
  "/customers/organizations/:id/print",
  authCheck,
  printOrganizationBill,
);
router.patch(
  "/customers/:id/organization-type",
  authCheck,
  updateCustomerOrganizationType,
);

module.exports = router;
