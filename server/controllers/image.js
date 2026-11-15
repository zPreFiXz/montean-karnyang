const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const {
  cloudinary,
  UPLOAD_FOLDER,
  isOwnImage,
} = require("../utils/cloudinaryImage");
// รับเฉพาะ data URI รูปภาพ กันการส่ง URL ให้เซิร์ฟเวอร์ไป fetch เอง (SSRF) และกันไฟล์ชนิดอื่น
const IMAGE_DATA_URI_REGEX = /^data:image\/(png|jpe?g|webp);base64,/;
// ~5MB หลังถอด base64 (base64 ยาวกว่าข้อมูลจริง ~33%)
const MAX_IMAGE_BASE64_LENGTH = 7 * 1024 * 1024;

exports.createImage = async (req, res) => {
  const { image } = req.body;

  if (typeof image !== "string" || !IMAGE_DATA_URI_REGEX.test(image)) {
    createError(400, "รูปภาพไม่ถูกต้อง รองรับเฉพาะไฟล์ PNG, JPG, WEBP");
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
};

exports.deleteImage = async (req, res) => {
  const { publicId } = req.body;

  if (!isOwnImage(publicId)) {
    createError(400, "รหัสรูปภาพไม่ถูกต้อง");
  }

  // รูปที่อะไหล่หรือบริการยังใช้อยู่ห้ามลบผ่านทางนี้ รูปเก่าถูกลบที่เซิร์ฟเวอร์หลังบันทึกสำเร็จ
  // ทางนี้มีไว้ทิ้งรูปที่เพิ่งอัปโหลดแต่บันทึกไม่ผ่าน
  const [part, service] = await Promise.all([
    prisma.part.findFirst({ where: { publicId }, select: { id: true } }),
    prisma.service.findFirst({ where: { publicId }, select: { id: true } }),
  ]);
  if (part || service) {
    createError(400, "ลบไม่ได้ เพราะรูปนี้ยังใช้อยู่");
  }

  await cloudinary.uploader.destroy(publicId, { invalidate: true });

  res.json({ message: "ลบรูปภาพเรียบร้อยแล้ว" });
};
