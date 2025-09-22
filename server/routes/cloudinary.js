const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const { createImage, deleteImage } = require("../controllers/cloudinary");

// @ENDPOINTS http://localhost:3000/api/image
router.post("/image", authCheck, createImage);

// @ENDPOINTS http://localhost:3000/api/delete-image
router.post("/delete-image", authCheck, deleteImage);

module.exports = router;
