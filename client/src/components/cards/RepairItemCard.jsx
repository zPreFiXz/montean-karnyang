import { Image, Wrench } from "lucide-react";
import { formatCurrency } from "@/utils/formats";

const RepairItemCard = ({ item, variant }) => {
  const renderProductInfo = (item) => {
    if (variant === "detail") {
      const isTire = item.part?.category?.name === "ยาง";

      if (
        isTire &&
        item.part?.typeSpecificData &&
        item.part.typeSpecificData.aspectRatio
      ) {
        return (
          <p className="text-normal line-clamp-2 text-[16px] font-semibold md:text-[18px]">
            {item.part.brand} {item.part.typeSpecificData.width}/
            {item.part.typeSpecificData.aspectRatio}R
            {item.part.typeSpecificData.rimDiameter} {item.part.name}
          </p>
        );
      }

      if (isTire && item.part?.typeSpecificData) {
        return (
          <p className="text-normal line-clamp-2 text-[16px] font-semibold md:text-[18px]">
            {item.part.brand} {item.part.typeSpecificData.width}R
            {item.part.typeSpecificData.rimDiameter} {item.part.name}
          </p>
        );
      }

      return (
        <p className="text-normal line-clamp-2 text-[16px] font-semibold md:text-[18px]">
          {item.part?.brand && `${item.part.brand} `}
          {item.part?.name || item.customName || item.service?.name}
        </p>
      );
    }

    const isTire = item.category?.name === "ยาง";

    if (isTire && item.typeSpecificData && item.typeSpecificData.aspectRatio) {
      return (
        <p className="text-normal line-clamp-2 text-[16px] font-semibold md:text-[18px]">
          {item.brand} {item.typeSpecificData.width}/
          {item.typeSpecificData.aspectRatio}R
          {item.typeSpecificData.rimDiameter} {item.name}
        </p>
      );
    }

    if (isTire && item.typeSpecificData) {
      return (
        <p className="text-normal line-clamp-2 text-[16px] font-semibold md:text-[18px]">
          {item.brand} {item.typeSpecificData.width}R
          {item.typeSpecificData.rimDiameter} {item.name}
        </p>
      );
    }

    return (
      <p className="text-normal line-clamp-2 text-[16px] font-semibold md:text-[18px]">
        {item.brand} {item.name}
      </p>
    );
  };

  const imageUrl = variant === "detail" ? item.part?.secureUrl : item.secureUrl;
  const itemName =
    variant === "detail" ? item.part?.name || item.service?.name : item.name;
  const unitPrice =
    variant === "detail" ? Number(item.unitPrice) : Number(item.sellingPrice);
  const unit =
    variant === "detail"
      ? item.part?.unit || item.service?.unit || ""
      : item.unit;
  const isService = variant === "detail" ? !!item.service : !item.partNumber;

  return (
    <div className="flex items-center gap-[16px]">
      <div className="shadow-primary bg-surface flex h-[80px] w-full items-center justify-between gap-[8px] rounded-[10px] px-[8px]">
        <div className="flex items-center gap-[8px]">
          <div className="border-subtle-light shadow-primary bg-surface flex items-center justify-center rounded-[10px] border">
            {imageUrl ? (
              <div className="h-[60px] w-[60px]">
                <img
                  src={imageUrl}
                  alt={itemName}
                  className="h-full w-full rounded-[10px] object-cover"
                />
              </div>
            ) : (
              <div className="text-subtle-light flex h-[60px] w-[60px] items-center justify-center">
                {isService ? (
                  <Wrench className="h-8 w-8" />
                ) : (
                  <Image className="h-8 w-8" />
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            {renderProductInfo(item)}
            <p className="text-subtle-dark line-clamp-1 text-[16px] font-semibold md:text-[18px]">
              {formatCurrency(unitPrice)} × {item.quantity} {unit}
            </p>
          </div>
        </div>
        <p className="text-primary text-[22px] font-semibold text-nowrap md:text-[24px]">
          {formatCurrency(unitPrice * item.quantity)}
        </p>
      </div>
    </div>
  );
};

export default RepairItemCard;
