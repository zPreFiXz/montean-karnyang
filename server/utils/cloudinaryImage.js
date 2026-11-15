const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOAD_FOLDER = "montean-karnyang";

// ลบได้เฉพาะรูปในโฟลเดอร์ของระบบนี้ กันลบ asset อื่นในบัญชี Cloudinary
const isOwnImage = (publicId) =>
  typeof publicId === "string" && publicId.startsWith(`${UPLOAD_FOLDER}/`);

// เรียกหลังบันทึกฐานข้อมูลสำเร็จเท่านั้น ลบไม่ผ่านแค่เหลือรูปค้าง ข้อมูลยังถูกต้อง จึงไม่ทำให้คำขอล้ม
const destroyImageQuietly = async (publicId) => {
  if (!isOwnImage(publicId)) return;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (error) {
    console.error("Cloudinary destroy failed:", publicId, error?.message);
  }
};

module.exports = { cloudinary, UPLOAD_FOLDER, isOwnImage, destroyImageQuietly };
