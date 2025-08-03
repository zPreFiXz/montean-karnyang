const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const {
  getParts,
  getPartById,
  createPart,
  updatePart,
  deletePart,
} = require("../controllers/part");

// @ENDPOINTS http://localhost:3000/api/parts
router.get("/parts", authCheck, getParts);

// @ENDPOINTS http://localhost:3000/api/part/1
router.get("/part/:id", authCheck, getPartById);

// @ENDPOINTS http://localhost:3000/api/part
router.post("/part", authCheck, createPart);

// @ENDPOINTS http://localhost:3000/api/part/1
router.put("/part/:id", authCheck, updatePart);

// @ENDPOINTS http://localhost:3000/api/part/1
router.delete("/part/:id", authCheck, deletePart);

module.exports = router;
