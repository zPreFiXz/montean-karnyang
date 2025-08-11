const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const { createImage, deleteImage } = require("../controllers/cloudinary");

// @ENDPOINTS http://localhost:3000/api/images
router.post("/images", authCheck, createImage);

// @ENDPOINTS http://localhost:3000/api/deleteImage
router.post("/deleteImage", authCheck, deleteImage);

module.exports = router;
