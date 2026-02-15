import { useState, useMemo } from "react";
import { Car } from "./Icons";

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

const findBrandKey = (brandText) => {
  const brandLower = brandText?.toLowerCase() || "";
  for (const key of Object.keys(BRAND_MAP)) {
    if (brandLower.includes(key)) return key;
  }
  return null;
};

const BrandImage = ({ brandKey, alt, fallbackIcon, borderColor }) => {
  const imagePaths = useMemo(
    () => [`/brands/${brandKey}.png`, `/brands/${brandKey}.jpg`],
    [brandKey],
  );
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

  return (
    <div className={`${ICON_SIZE} ${ICON_BASE_STYLE}`} style={{ borderColor }}>
      {!allFailed && (
        <img
          key={imagePaths[currentIndex]}
          src={imagePaths[currentIndex]}
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

const BrandIcons = ({ brand, color = "#1976d2" }) => {
  const brandKey = findBrandKey(brand);

  if (brandKey) {
    return (
      <BrandImage
        brandKey={brandKey}
        alt={`${BRAND_MAP[brandKey]} Logo`}
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
