const express = require("express");
const router = express.Router();
const { validate, createServiceSchema } = require("../utils/validator");

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const {
  getService,
  createService,
  updateService,
  deleteService,
} = require("../controllers/service");

// @ENDPOINTS http://localhost:3000/api/services
router.get("/services", authCheck, getService);

// @ENDPOINTS http://localhost:3000/api/service
router.post(
  "/service",
  authCheck,
  validate(createServiceSchema),
  createService
);

// @ENDPOINTS http://localhost:3000/api/service/1
router.put("/service/:id", authCheck, updateService);

// @ENDPOINTS http://localhost:3000/api/service/1
router.delete("/service/:id", authCheck, deleteService);

module.exports = router;
