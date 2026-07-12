const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const { createImage, deleteImage } = require("../controllers/cloudinary");

router.post("/images", authCheck, createImage);
router.delete("/images", authCheck, deleteImage);

module.exports = router;
