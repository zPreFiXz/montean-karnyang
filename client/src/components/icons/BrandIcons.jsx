import { useState } from "react";
import { Car } from "./Icons";

const ICON_SIZE = "w-[45px] h-[45px]";
const IMAGE_SIZE = "w-[35px] h-[35px]";
const ICON_BASE_STYLE =
  "flex items-center justify-center border-2 rounded-full bg-surface";

// นามสกุลไฟล์ระบุไว้ตรงๆ ไม่ใช่ลองยิง .png ก่อนแล้วค่อยตกไป .jpg
// เพราะยี่ห้อที่เป็น .jpg จะเสียเวลาไปกับคำขอที่ 404 ทุกครั้ง แล้วโชว์ไอคอนรถเปล่าคั่นระหว่างรอ
const BRAND_MAP = {
  toyota: { label: "Toyota", file: "toyota.png" },
  honda: { label: "Honda", file: "honda.png" },
  isuzu: { label: "Isuzu", file: "isuzu.jpg" },
  nissan: { label: "Nissan", file: "nissan.png" },
  mazda: { label: "Mazda", file: "mazda.png" },
  mitsubishi: { label: "Mitsubishi", file: "mitsubishi.png" },
  ford: { label: "Ford", file: "ford.png" },
  suzuki: { label: "Suzuki", file: "suzuki.png" },
  mg: { label: "MG", file: "mg.png" },
  chevrolet: { label: "Chevrolet", file: "chevrolet.png" },
  hyundai: { label: "Hyundai", file: "hyundai.png" },
  tata: { label: "Tata", file: "tata.png" },
};

const findBrandKey = (brandText) => {
  const brandLower = brandText?.toLowerCase() || "";
  for (const key of Object.keys(BRAND_MAP)) {
    if (brandLower.includes(key)) return key;
  }
  return null;
};

const BrandImage = ({ file, alt, fallbackIcon, borderColor }) => {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`${ICON_SIZE} ${ICON_BASE_STYLE}`} style={{ borderColor }}>
      {failed ? (
        <div className="flex items-center justify-center">{fallbackIcon}</div>
      ) : (
        <img
          src={`/brands/${file}`}
          alt={alt}
          className={`${IMAGE_SIZE} object-contain`}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
};

const BrandIcons = ({ brand, color = "#1976d2" }) => {
  const brandKey = findBrandKey(brand);

  if (brandKey) {
    return (
      <BrandImage
        file={BRAND_MAP[brandKey].file}
        alt={`${BRAND_MAP[brandKey].label} Logo`}
        fallbackIcon={<Car color={color} />}
        borderColor={color}
      />
    );
  }

  return (
    <div
      className={`${ICON_SIZE} ${ICON_BASE_STYLE}`}
      style={{ borderColor: color }}
    >
      <Car color={color} />
    </div>
  );
};

export default BrandIcons;
