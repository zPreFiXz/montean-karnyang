const crypto = require("crypto");

// ลายนิ้วมือของรหัสผ่านปัจจุบัน ฝังไว้ใน token เปลี่ยนรหัสเมื่อไร token เก่าทุกเครื่องใช้ไม่ได้ทันที
// ใช้ HMAC กับ JWT_SECRET token อ่านได้ (base64) จึงไม่ใส่ค่าที่ได้จาก hash ตรงๆ
const passwordFingerprint = (passwordHash) =>
  crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(passwordHash)
    .digest("base64url")
    .slice(0, 16);

module.exports = { passwordFingerprint };
