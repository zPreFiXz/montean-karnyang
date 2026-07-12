const cloudinary = require("cloudinary").v2;
const createError = require("../utils/createError");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOAD_FOLDER = "montean-karnyang";
// รับเฉพาะ data URI รูปภาพ กันการส่ง URL ให้เซิร์ฟเวอร์ไป fetch เอง (SSRF) และกันไฟล์ชนิดอื่น
const IMAGE_DATA_URI_REGEX = /^data:image\/(png|jpe?g|webp);base64,/;
// ~5MB หลังถอด base64 (base64 ยาวกว่าข้อมูลจริง ~33%)
const MAX_IMAGE_BASE64_LENGTH = 7 * 1024 * 1024;

exports.createImage = async (req, res, next) => {
  try {
    const { image } = req.body;

    if (typeof image !== "string" || !IMAGE_DATA_URI_REGEX.test(image)) {
      createError(400, "รูปภาพไม่ถูกต้อง รองรับเฉพาะไฟล์ PNG, JPG หรือ WebP");
    }

    if (image.length > MAX_IMAGE_BASE64_LENGTH) {
      createError(400, "ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)");
    }

    const result = await cloudinary.uploader.upload(image, {
      public_id: `${Date.now()}`,
      resource_type: "image",
      folder: UPLOAD_FOLDER,
    });

    res.json({ publicId: result.public_id, secureUrl: result.secure_url });
  } catch (error) {
    next(error);
  }
};

exports.deleteImage = async (req, res, next) => {
  try {
    const { publicId } = req.body;

    // ลบได้เฉพาะรูปในโฟลเดอร์ของระบบนี้ กันลบ asset อื่นในบัญชี Cloudinary
    if (
      typeof publicId !== "string" ||
      !publicId.startsWith(`${UPLOAD_FOLDER}/`)
    ) {
      createError(400, "รหัสรูปภาพไม่ถูกต้อง");
    }

    await cloudinary.uploader.destroy(publicId);

    res.json({ message: "ลบรูปภาพเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};
