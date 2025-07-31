const express = require("express");
const router = express.Router();

// Controllers

const { authCheck } = require("../middlewares/auth");
const {
  getParts,
  getPartById,
  createPart,
  updatePart,
  deletePart,
} = require("../controllers/part.controller");

// @ENDPOINTS http://localhost:3000/api/parts
// METHOD GET
// ACCESS Private
router.get("/parts", authCheck, getParts);

// @ENDPOINTS http://localhost:3000/api/part/1
// METHOD GET
// ACCESS Private
router.get("/part/:id", authCheck, getPartById);

// @ENDPOINTS http://localhost:3000/api/part
// METHOD POST
// ACCESS Private
router.post("/part", authCheck, createPart);

// @ENDPOINTS http://localhost:3000/api/part/1
// METHOD PUT
// ACCESS Private
router.put("/part/:id", authCheck, updatePart);

// @ENDPOINTS http://localhost:3000/api/part/1
// METHOD DELETE
// ACCESS Private
router.delete("/part/:id", authCheck, deletePart);

module.exports = router;
