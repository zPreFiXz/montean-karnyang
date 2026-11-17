const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const { serviceSchema, serviceOrderSchema } = require("../utils/schemas");

const { authCheck } = require("../middlewares/auth");

const {
  listServices,
  createService,
  updateService,
  deleteService,
  updateServiceOrder,
} = require("../controllers/service");

router.get("/services", authCheck, listServices);
// ต้องอยู่ก่อน /services/:id ไม่งั้น "order" จะถูกจับเป็นรหัส
router.put(
  "/services/order",
  authCheck,
  validate(serviceOrderSchema),
  updateServiceOrder,
);
router.post("/services", authCheck, validate(serviceSchema), createService);
router.put("/services/:id", authCheck, validate(serviceSchema), updateService);
router.delete("/services/:id", authCheck, deleteService);

module.exports = router;
