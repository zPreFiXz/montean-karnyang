const express = require("express");
const router = express.Router();
const { createPartSchema, validate } = require("../utils/validator");

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const {
  getPartById,
  createPart,
  updatePart,
  deletePart,
  addStock,
} = require("../controllers/part");

// @ENDPOINTS http://localhost:3000/api/part/1
router.get("/part/:id", authCheck, getPartById);

// @ENDPOINTS http://localhost:3000/api/part
router.post("/part", authCheck, validate(createPartSchema), createPart);

// @ENDPOINTS http://localhost:3000/api/part/1
router.put("/part/:id", authCheck, updatePart);

// @ENDPOINTS http://localhost:3000/api/part/1/add-stock
router.patch("/part/:id/add-stock", authCheck, addStock);

// @ENDPOINTS http://localhost:3000/api/part/1
router.delete("/part/:id", authCheck, deletePart);

module.exports = router;
