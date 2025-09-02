import { Image, Wrench } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const RepairItemCard = ({ item, variant }) => {
  const renderProductInfo = (item) => {
    // สำหรับ RepairDetail (variant = "detail")
    if (variant === "detail") {
      const isTire = item.part?.category?.name === "ยาง";

      // แสดงข้อมูลยางที่มีขนาดแก้มยาง
      if (
        isTire &&
        item.part?.typeSpecificData &&
        item.part.typeSpecificData.aspectRatio
      ) {
        return (
          <p className="font-semibold text-[16px] text-normal line-clamp-2">
            {item.part.brand} {item.part.typeSpecificData.width}/
            {item.part.typeSpecificData.aspectRatio}R
            {item.part.typeSpecificData.rimDiameter} {item.part.name}
          </p>
        );
      }

      // แสดงข้อมูลยางที่ไม่มีขนาดแก้มยาง
      if (isTire && item.part?.typeSpecificData) {
        return (
          <p className="font-semibold text-[16px] text-normal line-clamp-2">
            {item.part.brand} {item.part.typeSpecificData.width}R
            {item.part.typeSpecificData.rimDiameter} {item.part.name}
          </p>
        );
      }

      // แสดงข้อมูลอะไหล่หรือบริการ
      return (
        <p className="font-semibold text-[16px] text-normal line-clamp-2">
          {item.part?.brand && `${item.part.brand} `}
          {item.part?.name || item.service?.name}
        </p>
      );
    }

    // สำหรับ RepairSummary (variant = "summary")
    const isTire = item.category?.name === "ยาง";

    // แสดงข้อมูลยางที่มีขนาดแก้มยาง
    if (isTire && item.typeSpecificData && item.typeSpecificData.aspectRatio) {
      return (
        <p className="font-semibold text-[16px] text-normal line-clamp-2">
          {item.brand} {item.typeSpecificData.width}/
          {item.typeSpecificData.aspectRatio}R
          {item.typeSpecificData.rimDiameter} {item.name}
        </p>
      );
    }

    // แสดงข้อมูลยางที่ไม่มีขนาดแก้มยาง
    if (isTire && item.typeSpecificData) {
      return (
        <p className="font-semibold text-[16px] text-normal line-clamp-2">
          {item.brand} {item.typeSpecificData.width}R
          {item.typeSpecificData.rimDiameter} {item.name}
        </p>
      );
    }

    // แสดงข้อมูลอะไหล่หรือบริการ
    return (
      <p className="font-semibold text-[16px] text-normal line-clamp-2">
        {item.brand} {item.name}
      </p>
    );
  };

  // ข้อมูลสำหรับแสดงผล
  const imageUrl = variant === "detail" ? item.part?.secureUrl : item.secureUrl;
  const itemName =
    variant === "detail" ? item.part?.name || item.service?.name : item.name;
  const unitPrice =
    variant === "detail" ? Number(item.unitPrice) : Number(item.sellingPrice);
  const unit =
    variant === "detail"
      ? item.part?.unit || item.service?.unit || ""
      : item.unit;
      
  // ตรวจสอบว่าเป็นบริการหรือไม่
  const isService = variant === "detail" ? !!item.service : !item.partNumber;

  return (
    <div className="flex items-center gap-[16px]">
      <div className="flex justify-between items-center w-full h-[80px] px-[8px] rounded-[10px] bg-white shadow-primary">
        <div className="flex items-center gap-[8px]">
          <div className="flex items-center justify-center rounded-[10px] border border-subtle-light bg-white shadow-primary">
            {imageUrl ? (
              <div className="w-[60px] h-[60px]">
                <img
                  src={imageUrl}
                  alt={itemName}
                  className="object-cover w-full h-full rounded-[10px]"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-[60px] h-[60px] text-subtle-light">
                {isService ? (
                  <Wrench className="w-8 h-8" />
                ) : (
                  <Image className="w-8 h-8" />
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            {renderProductInfo(item)}
            <p className="font-semibold text-[16px] text-subtle-dark">
              {formatCurrency(unitPrice)} × {item.quantity} {unit}
            </p>
          </div>
        </div>
        <p className="font-semibold text-[20px] text-primary text-nowrap">
          {formatCurrency(unitPrice * item.quantity)}
        </p>
      </div>
    </div>
  );
};

export default RepairItemCard;
