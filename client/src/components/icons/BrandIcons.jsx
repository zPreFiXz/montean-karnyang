import { useState } from "react";
import { Car } from "./Icon";

const ICON_SIZE = "w-[45px] h-[45px]";
const IMAGE_SIZE = "w-[35px] h-[35px]";
const ICON_BASE_STYLE =
  "flex items-center justify-center border-2 rounded-full bg-surface";

const BRAND_MAP = {
  toyota: "Toyota",
  honda: "Honda",
  isuzu: "Isuzu",
  nissan: "Nissan",
  mazda: "Mazda",
  mitsubishi: "Mitsubishi",
  ford: "Ford",
  suzuki: "Suzuki",
  mg: "MG",
  chevrolet: "Chevrolet",
  hyundai: "Hyundai",
  tata: "Tata",
};

const getBrandImagePath = (brandName) => {
  const name = brandName.toLowerCase();
  return [`/brands/${name}.png`, `/brands/${name}.jpg`];
};

const findBrandInfo = (brandText) => {
  const brandLower = brandText?.toLowerCase() || "";

  for (const [key, name] of Object.entries(BRAND_MAP)) {
    if (brandLower.includes(key)) {
      return {
        imagePaths: getBrandImagePath(key),
        brandName: name,
      };
    }
  }

  return null;
};

export const BrandImage = ({
  imagePaths,
  alt,
  fallbackIcon,
  borderColor = "#1976d2",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [allFailed, setAllFailed] = useState(false);

  const handleImageError = () => {
    if (currentIndex < imagePaths.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setImageLoaded(false);
    } else {
      setAllFailed(true);
    }
  };

  const showFallback = allFailed || !imageLoaded;
  const currentSrc = imagePaths[currentIndex];

  return (
    <div
      className={`${ICON_SIZE} ${ICON_BASE_STYLE}`}
      style={{ borderColor: borderColor }}
    >
      {!allFailed && (
        <img
          key={currentSrc}
          src={currentSrc}
          alt={alt}
          className={`${IMAGE_SIZE} object-contain`}
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
          style={{ display: imageLoaded ? "block" : "none" }}
        />
      )}
      {showFallback && (
        <div className="flex items-center justify-center">{fallbackIcon}</div>
      )}
    </div>
  );
};

const DefaultCarIcon = ({ color, borderColor = "#1976d2" }) => (
  <div
    className={`${ICON_SIZE} ${ICON_BASE_STYLE}`}
    style={{ borderColor: borderColor }}
  >
    <Car color={color} />
  </div>
);

export const getBrandIcon = (brand, color = "#1976d2") => {
  const brandInfo = findBrandInfo(brand);

  const BrandIconComponent = ({ color: iconColor }) => {
    const finalColor = iconColor || color;

    // ถ้ามีข้อมูลแบรนด์ ให้แสดงโลโก้แบรนด์
    if (brandInfo) {
      return (
        <BrandImage
          imagePaths={brandInfo.imagePaths}
          alt={`${brandInfo.brandName} Logo`}
          fallbackIcon={<Car color={finalColor} />}
          borderColor={finalColor}
        />
      );
    }

    // ถ้าไม่มีข้อมูลแบรนด์ ให้แสดงไอคอนรถทั่วไป
    return <DefaultCarIcon color={finalColor} borderColor={finalColor} />;
  };

  return BrandIconComponent;
};
