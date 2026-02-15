const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const { createImage, deleteImage } = require("../controllers/cloudinary");

// @ENDPOINTS http://localhost:3000/api/images
router.post("/images", authCheck, createImage);

// @ENDPOINTS http://localhost:3000/api/images/delete
router.post("/images/delete", authCheck, deleteImage);

module.exports = router;
