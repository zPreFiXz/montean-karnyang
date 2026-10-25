import { useState } from "react";

// รูปที่ถูกลบออกจาก Cloudinary ไปแล้วจะขึ้นเป็นรูปเสีย จึงสลับไปใช้ไอคอนแทนเหมือนรายการที่ไม่มีรูป
const ItemImage = ({ src, alt, className, fallback = null }) => {
  const [failedSrc, setFailedSrc] = useState(null);

  if (!src || failedSrc === src) return fallback;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
};

export default ItemImage;
