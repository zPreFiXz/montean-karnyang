const express = require("express");
const router = express.Router();
const { validate, serviceSchema } = require("../utils/validator");

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const {
  getServices,
  createService,
  updateService,
  deleteService,
} = require("../controllers/service");

// @ENDPOINTS http://localhost:3000/api/services
router.get("/services", authCheck, getServices);

// @ENDPOINTS http://localhost:3000/api/services
router.post(
  "/services",
  authCheck,
  validate(serviceSchema),
  createService
);

// @ENDPOINTS http://localhost:3000/api/services/1
router.put(
  "/services/:id",
  authCheck,
  validate(serviceSchema),
  updateService
);

// @ENDPOINTS http://localhost:3000/api/services/1
router.delete("/services/:id", authCheck, deleteService);

module.exports = router;
