const express = require("express");
const router = express.Router();
const { validate, serviceSchema } = require("../utils/validator");

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const {
  listServices,
  createService,
  updateService,
  deleteService,
} = require("../controllers/service");

router.get("/services", authCheck, listServices);
router.post(
  "/services",
  authCheck,
  validate(serviceSchema),
  createService
);
router.put(
  "/services/:id",
  authCheck,
  validate(serviceSchema),
  updateService
);
router.delete("/services/:id", authCheck, deleteService);

module.exports = router;
