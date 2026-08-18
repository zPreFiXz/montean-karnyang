import { Image, Wrench } from "lucide-react";
import { formatCurrency } from "@/utils/formats";
import { formatSoldLots } from "@/utils/tireLot";

const RepairItemCard = ({ item, variant }) => {
  const renderProductInfo = (item) => {
    // ประวัติซ่อมแสดงชื่อที่บันทึกไว้ ณ วันซ่อม ไม่ประกอบใหม่จากอะไหล่ปัจจุบัน (อะไหล่อาจถูกลบหรือแก้ชื่อ)
    if (variant === "detail") {
      return (
        <p className="text-normal line-clamp-2 text-base font-semibold md:text-lg">
          {item.itemName}
        </p>
      );
    }

    const isTire = item.category?.name === "ยาง";

    if (isTire && item.attributes && item.attributes.aspectRatio) {
      return (
        <p className="text-normal line-clamp-2 text-base font-semibold md:text-lg">
          {item.brand} {item.attributes.width}/{item.attributes.aspectRatio}R
          {item.attributes.rimDiameter} {item.name}
        </p>
      );
    }

    if (isTire && item.attributes) {
      return (
        <p className="text-normal line-clamp-2 text-base font-semibold md:text-lg">
          {item.brand} {item.attributes.width}R{item.attributes.rimDiameter}{" "}
          {item.name}
        </p>
      );
    }

    return (
      <p className="text-normal line-clamp-2 text-base font-semibold md:text-lg">
        {item.brand} {item.name}
      </p>
    );
  };

  const imageUrl = variant === "detail" ? item.part?.secureUrl : item.secureUrl;
  const itemName = variant === "detail" ? item.itemName : item.name;
  const unitPrice =
    variant === "detail" ? Number(item.unitPrice) : Number(item.sellingPrice);
  const unit =
    variant === "detail"
      ? item.part?.unit || item.service?.unit || ""
      : item.unit;
  const isService = variant === "detail" ? !!item.service : !item.partNumber;
  const soldLotsLabel =
    variant === "detail" ? formatSoldLots(item.soldLots) : "";

  return (
    // min-h ไม่ใช่ h: หน้ารายละเอียดมีบรรทัดสัปดาห์/ปีผลิตเพิ่ม เนื้อหาจะเกิน 80px
    <div className="shadow-primary bg-surface flex min-h-[80px] w-full items-center justify-between gap-[8px] rounded-[10px] px-[8px] py-[8px]">
      <div className="flex min-w-0 flex-1 items-center gap-[8px]">
        <div className="shadow-primary bg-surface flex shrink-0 items-center justify-center rounded-[10px] border border-gray-200">
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

        <div className="flex min-w-0 flex-col">
          {renderProductInfo(item)}
          {variant === "detail" && soldLotsLabel && (
            <p className="text-subtle-light line-clamp-1 text-sm font-medium md:text-base">
              สัปดาห์/ปีผลิต: {soldLotsLabel}
            </p>
          )}
          <p className="text-subtle-dark line-clamp-1 text-base font-semibold md:text-lg">
            {formatCurrency(unitPrice)} × {item.quantity} {unit}
          </p>
        </div>
      </div>

      <p className="text-primary shrink-0 text-[22px] font-semibold text-nowrap md:text-2xl">
        {formatCurrency(unitPrice * item.quantity)}
      </p>
    </div>
  );
};

export default RepairItemCard;
