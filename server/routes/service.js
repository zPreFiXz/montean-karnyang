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
  listServiceItemNames,
} = require("../controllers/service");

router.get("/services", authCheck, listServices);
// ชื่อที่เคยพิมพ์ทับไว้ในบิลของบริการตัวนี้ ไว้ให้เลือกซ้ำตอนเปิดบิลใหม่
router.get("/services/:id/item-names", authCheck, listServiceItemNames);
router.post("/services", authCheck, validate(serviceSchema), createService);
router.put("/services/:id", authCheck, validate(serviceSchema), updateService);
router.delete("/services/:id", authCheck, deleteService);

module.exports = router;
