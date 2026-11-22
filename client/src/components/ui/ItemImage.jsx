import { useState } from "react";

// รูปต้นฉบับใหญ่หลายร้อย KB ต่อรูป กรอบ 60px ในรายการขอรูปย่อจาก Cloudinary แทน (เผื่อจอความละเอียด 3 เท่า)
const THUMBNAIL_TRANSFORM = "c_fill,w_180,h_180,f_auto,q_auto";
const thumbnailOf = (src) =>
  src.includes("res.cloudinary.com") && src.includes("/upload/")
    ? src.replace("/upload/", `/upload/${THUMBNAIL_TRANSFORM}/`)
    : src;

// รูปที่ถูกลบออกจาก Cloudinary ไปแล้วจะขึ้นเป็นรูปเสีย จึงสลับไปใช้ไอคอนแทนเหมือนรายการที่ไม่มีรูป
// thumbnail = รูปในการ์ดรายการ ไม่ใช่รูปขยายในหน้าต่างรายละเอียด
const ItemImage = ({ src, alt, className, fallback = null, thumbnail }) => {
  const [failedSrc, setFailedSrc] = useState(null);

  if (!src || failedSrc === src) return fallback;

  return (
    <img
      src={thumbnail ? thumbnailOf(src) : src}
      alt={alt}
      className={className}
      // รายการยาวหลายร้อยการ์ด โหลดเฉพาะรูปที่ใกล้จะเลื่อนถึง
      loading="lazy"
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  );
};

export default ItemImage;
