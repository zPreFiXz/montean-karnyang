const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const { serviceSchema } = require("../utils/schemas");

const { authCheck } = require("../middlewares/auth");

const {
  listServices,
  createService,
  updateService,
  deleteService,
} = require("../controllers/service");

router.get("/services", authCheck, listServices);
router.post("/services", authCheck, validate(serviceSchema), createService);
router.put("/services/:id", authCheck, validate(serviceSchema), updateService);
router.delete("/services/:id", authCheck, deleteService);

module.exports = router;
