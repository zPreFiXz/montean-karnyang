const express = require("express");
const router = express.Router();

const { authCheck } = require("../middlewares/auth");

const { createImage, deleteImage } = require("../controllers/image");

router.post("/images", authCheck, createImage);
router.delete("/images", authCheck, deleteImage);

module.exports = router;
