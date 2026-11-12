const express = require("express");
const router = express.Router();

const { authCheck } = require("../middlewares/auth");

const {
  listCustomers,
  listCustomerDirectory,
  getCustomer,
  updateCustomerOrganizationType,
  listOrganizations,
  listOrganizationRepairs,
  printOrganizationBill,
  peekOrganizationBillNo,
} = require("../controllers/customer");

router.get("/customers", authCheck, listCustomers);
router.get("/customers/directory", authCheck, listCustomerDirectory);
// ต้องมาก่อน "/customers/:id" ไม่งั้น organizations จะถูกอ่านเป็นไอดี
router.get("/customers/organizations", authCheck, listOrganizations);
router.get(
  "/customers/organizations/:id/repairs",
  authCheck,
  listOrganizationRepairs,
);
router.get(
  "/customers/organizations/:id/billing-no",
  authCheck,
  peekOrganizationBillNo,
);
router.post(
  "/customers/organizations/:id/print",
  authCheck,
  printOrganizationBill,
);
router.get("/customers/:id", authCheck, getCustomer);
router.patch(
  "/customers/:id/organization-type",
  authCheck,
  updateCustomerOrganizationType,
);

module.exports = router;
