import { Image, Wrench, TicketPercent } from "lucide-react";
import { formatCurrency, formatQuantity } from "@/utils/formats";
import { onKeyActivate } from "@/utils/a11y";
import { isPartPlaceholderItem, isDiscountItem } from "@/constants/services";
import { SparePart } from "@/components/icons/Icons";
import { soldLotEntries } from "@/utils/tireLot";
import { isTireCategoryName } from "@/constants/categories";
import { formatProductName } from "@/utils/tireSize";

const RepairItemCard = ({ item, variant, onClick }) => {
  // ชื่อในบิลถูกอัปเดตให้ตรงกับคลังตั้งแต่ตอนแก้ชื่ออะไหล่แล้ว (ดู updatePart ฝั่งเซิร์ฟเวอร์)
  // ตรงนี้จึงอ่านค่าที่บันทึกไว้ตรงๆ และของที่ถูกลบออกจากคลังก็ยังมีชื่อเดิมให้อ่าน
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
        {formatProductName({
          brand: item.brand,
          name: item.name,
          attributes: item.attributes,
          isTire: isTireCategoryName(item.category?.name),
        })}
      </p>
    );
  };

  const imageUrl = variant === "detail" ? item.part?.secureUrl : item.secureUrl;
  const itemName = variant === "detail" ? detailName : item.name;
  const unitPrice =
    variant === "detail" ? Number(item.unitPrice) : Number(item.sellingPrice);
  const unit =
    variant === "detail"
      ? item.part?.unit || item.service?.unit || ""
      : item.unit;
  const isService = variant === "detail" ? !!item.service : !item.partNumber;
  // อะไหล่ที่ซื้อมาใช้เลยถูกบันทึกเป็นบริการ แต่ควรอ่านว่าเป็นอะไหล่
  const isPartLine = isPartPlaceholderItem(item);
  const soldLots = variant === "detail" ? soldLotEntries(item.soldLots) : [];

  return (
    // min-h ไม่ใช่ h: หน้ารายละเอียดมีบรรทัดสัปดาห์/ปีผลิตเพิ่ม เนื้อหาจะเกิน 80px
    // กดได้เมื่อหน้าที่เรียกใช้ส่ง onClick มา (หน้าสรุปเปิดหน้าต่างรายละเอียด)
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? onKeyActivate(onClick) : undefined}
      onClick={onClick}
      className={`shadow-primary bg-surface flex min-h-[80px] w-full items-center justify-between gap-[8px] rounded-[10px] px-[8px] py-[8px] ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
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
              {/* งานบริการใช้ประแจ ที่เหลือคืออะไหล่ รวมถึงบรรทัดอะไหล่ที่ซื้อมาใช้เลย
                  ซึ่งระบบเก็บเป็นบริการแต่ความหมายคืออะไหล่
                  ส่วนลดไม่ใช่ทั้งสองอย่าง จึงใช้ป้ายลดราคา */}
              {isDiscountItem(item) ? (
                <TicketPercent className="h-9 w-9" />
              ) : isService && !isPartLine ? (
                <Wrench className="h-9 w-9" />
              ) : (
                <SparePart className="h-10 w-10" />
              )}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col">
          {renderProductInfo(item)}
          {/* ยางรุ่นเดียวกันในบิลใบเดียวอาจมาจากคนละล็อต จึงแยกเป็นชิปละล็อต
              ไม่ใช่ข้อความบรรทัดเดียวที่โดนตัดหางทิ้งเมื่อมีหลายล็อต */}
          {soldLots.length > 0 && (
            /* ป้ายอยู่บรรทัดเดียวกับชิป ยางส่วนใหญ่มาจากล็อตเดียว การ์ดจึงสูงเท่าอะไหล่ทั่วไป
               ชิปตกบรรทัดเองเมื่อมีหลายล็อตจริง */
            <div className="mt-[2px] flex flex-wrap items-center gap-[4px]">
              <span className="text-subtle-light text-sm font-medium md:text-base">
                สัปดาห์/ปีผลิต:
              </span>
              {soldLots.map((lot) => (
                <span
                  key={lot.dotCode}
                  className="bg-primary-soft text-primary rounded-full px-[8px] py-[1px] text-sm font-semibold md:text-base"
                >
                  {lot.dotCode} × {lot.quantity}
                </span>
              ))}
            </div>
          )}
          <p className="text-subtle-dark line-clamp-1 text-base font-semibold md:text-lg">
            {formatCurrency(unitPrice)} × {formatQuantity(item.quantity)} {unit}
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
