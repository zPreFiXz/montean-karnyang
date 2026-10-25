import { Wrench, TicketPercent } from "lucide-react";
import { formatCurrency, formatQuantity } from "@/utils/formats";
import { onKeyActivate } from "@/utils/a11y";
import { isPartLikeItem, isDiscountItem, lineUnit } from "@/constants/services";
import { SparePart } from "@/components/icons/Icons";
import { soldLotEntries } from "@/utils/tireLot";
import { isTireCategoryName, USED_TIRE_CATEGORY } from "@/constants/categories";
import { formatProductName } from "@/utils/tireSize";
import ItemImage from "@/components/ui/ItemImage";

// sideLabel = ฝั่งที่ติดตั้ง (L / R / L-R) สำหรับหน้าที่ไม่ได้แบ่งหัวข้อตามฝั่ง
// rightSlot แทนที่ยอดรวมทางขวา (โหมดจัดเรียงใส่ลูกศรตรงนี้ เหมือนหน้ากรอกบิล)
const RepairItemCard = ({ item, variant, onClick, sideLabel, rightSlot }) => {
  // ชื่อในบิลถูกอัปเดตตามคลังตอนแก้ชื่ออะไหล่แล้ว (ดู updatePart) และของที่ถูกลบจากคลังก็ยังมีชื่อเดิม
  const detailName = item.itemName;

  const renderProductInfo = (item) => {
    if (variant === "detail") {
      return (
        <p className="text-normal line-clamp-2 text-base font-semibold md:text-lg">
          {detailName}
        </p>
      );
    }

    return (
      <p className="text-normal line-clamp-2 text-base font-semibold md:text-lg">
        {/* ชื่อที่พิมพ์ทับไว้เองคือทั้งบรรทัดแล้ว ไม่ต้องเติมยี่ห้อกับขนาดยางนำหน้าอีก */}
        {item.hasCustomName
          ? item.name
          : formatProductName({
              brand: item.brand,
              name: item.name,
              attributes: item.attributes,
              isTire: isTireCategoryName(item.category?.name),
              isUsedTire: item.category?.name === USED_TIRE_CATEGORY,
            })}
      </p>
    );
  };

  const imageUrl =
    variant === "detail"
      ? item.part?.secureUrl || item.service?.secureUrl
      : item.secureUrl;
  const itemName = variant === "detail" ? detailName : item.name;
  const unitPrice =
    variant === "detail" ? Number(item.unitPrice) : Number(item.sellingPrice);
  const unit = variant === "detail" ? lineUnit(item) : item.unit;
  const isService = variant === "detail" ? !!item.service : !item.partNumber;
  const isPartLine = isPartLikeItem(item);
  const soldLots = variant === "detail" ? soldLotEntries(item.soldLots) : [];

  return (
    // min-h ไม่ใช่ h เพราะบรรทัดสัปดาห์/ปีผลิตทำให้เกิน 80px
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? onKeyActivate(onClick) : undefined}
      onClick={onClick}
      className={`shadow-primary bg-surface flex min-h-20 w-full items-center justify-between gap-2 rounded-lg px-2 py-2 ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="shadow-primary bg-surface relative flex shrink-0 items-center justify-center rounded-lg border border-gray-200">
          {sideLabel && (
            <span className="bg-primary text-surface absolute -top-1.5 -left-1.5 z-10 rounded-sm px-1.5 text-sm leading-5 font-semibold shadow-sm md:text-base">
              {sideLabel}
            </span>
          )}
          <ItemImage
            src={imageUrl}
            alt={itemName}
            className="h-15 w-15 rounded-lg object-cover"
            fallback={
              <div className="text-subtle-light flex h-15 w-15 items-center justify-center">
                {isDiscountItem(item) ? (
                  <TicketPercent className="h-9 w-9" />
                ) : isService && !isPartLine ? (
                  <Wrench className="h-9 w-9" />
                ) : (
                  <SparePart className="h-10 w-10" />
                )}
              </div>
            }
          />
        </div>

        <div className="flex min-w-0 flex-col">
          {renderProductInfo(item)}
          {soldLots.length > 0 && (
            <div className="mt-0.5 flex flex-wrap items-center gap-1">
              <span className="text-subtle-light text-sm font-medium md:text-base">
                สัปดาห์/ปีผลิต:
              </span>
              {soldLots.map((lot) => (
                <span
                  key={lot.dotCode}
                  className="bg-primary-soft text-primary rounded-full px-2 py-px text-sm font-semibold md:text-base"
                >
                  {lot.dotCode} × {lot.quantity}
                </span>
              ))}
            </div>
          )}
          <p className="text-subtle-dark line-clamp-1 text-base font-semibold md:text-lg">
            {formatCurrency(unitPrice)}
            {/* เกินหนึ่งครั้งต้องบอก ไม่งั้นราคาต่อหน่วยกับยอดรวมจะไม่ตรงกัน */}
            {isService && !isPartLine && !unit && Number(item.quantity) === 1
              ? null
              : ` × ${formatQuantity(item.quantity)} ${unit || ""}`.trimEnd()}
          </p>
        </div>
      </div>

      {rightSlot ?? (
        <p className="text-primary shrink-0 text-[22px] font-semibold text-nowrap md:text-2xl">
          {formatCurrency(unitPrice * item.quantity)}
        </p>
      )}
    </div>
  );
};

export default RepairItemCard;
