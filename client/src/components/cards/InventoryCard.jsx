import { Wrench, AlertTriangle, TicketPercent } from "lucide-react";
import {
  formatCurrency,
  formatPriceRange,
  formatQuantity,
} from "@/utils/formats";
import { tracksStock } from "@/utils/stock";
import { isPartLikeItem, isDiscountItem } from "@/constants/services";
import { SparePart } from "@/components/icons/Icons";
import { isTireCategoryName, USED_TIRE_CATEGORY } from "@/constants/categories";
import { formatProductName } from "@/utils/tireSize";

const InventoryCard = ({
  brand,
  name,
  unit,
  sellingPrice,
  quantity,
  minStockLevel,
  attributes,
  secureUrl,
  category,
  // ช่วงราคาที่เคยขายจริง มีเฉพาะยางเปอร์เซ็นต์ (สภาพไม่เท่ากัน ราคาตั้งใช้กับทุกเส้นไม่ได้)
  soldPriceRange,
  oilSource,
  // หน้าที่ยึดสต็อกจริง (เช่นไดอะล็อกเลือกอะไหล่) เตือนหมดเมื่อเหลือ 0 แม้ไม่ได้ตั้งขั้นต่ำ
  alwaysWarnEmpty = false,
  // มีเมื่อการ์ดอยู่ในหน้าต่างเลือกรายการ กดรูปเพื่อดูรายละเอียดแทนการเลือกลงบิล
  onImageClick,
}) => {
  const isTire = isTireCategoryName(category);
  // ชุดน้ำมันไม่มีขั้นต่ำของตัวเอง แต่เหลือ 0 ชุดก็ต้องเตือน
  const warnEmpty = alwaysWarnEmpty || !!oilSource;
  const isService = category === "บริการ";

  const renderProductInfo = () => {
    return (
      <p className="text-normal line-clamp-2 overflow-hidden text-base font-semibold break-words md:text-lg">
        {formatProductName({
          brand,
          name,
          attributes,
          isTire,
          isUsedTire: category === USED_TIRE_CATEGORY,
        })}
      </p>
    );
  };

  return (
    // ระยะห่างระหว่างการ์ดอยู่บนตัวที่รับคลิก ไม่ใช่ที่นี่ ไม่งั้นช่องว่างจะกดได้ด้วย
    <div className="flex items-center gap-4">
      <div className="shadow-primary bg-surface flex h-20 w-full items-center justify-between gap-2 rounded-lg px-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            {...(onImageClick && {
              role: "button",
              tabIndex: 0,
              "aria-label": `ดูรายละเอียด ${name}`,
              onClick: (e) => {
                e.stopPropagation();
                onImageClick();
              },
              onKeyDown: (e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                e.stopPropagation();
                onImageClick();
              },
            })}
            className={`shadow-primary bg-surface flex shrink-0 items-center justify-center rounded-lg border border-gray-200 ${
              onImageClick ? "cursor-zoom-in" : ""
            }`}
          >
            {secureUrl ? (
              <div className="h-15 w-15">
                <img
                  src={secureUrl}
                  alt={name}
                  className="h-full w-full rounded-lg object-cover"
                />
              </div>
            ) : (
              <div className="text-subtle-light flex h-15 w-15 items-center justify-center">
                {isDiscountItem({ name }) ? (
                  <TicketPercent className="h-9 w-9" />
                ) : isService && !isPartLikeItem({ name }) ? (
                  <Wrench className="h-9 w-9" />
                ) : (
                  <SparePart className="h-10 w-10" />
                )}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col">
            {renderProductInfo()}

            {!isService &&
              (!warnEmpty && !tracksStock(minStockLevel) ? (
                <p className="text-subtle-dark text-base font-semibold md:text-lg">
                  {`จำนวน: ${formatQuantity(quantity)} ${unit}`}
                </p>
              ) : Number(quantity) === 0 ? (
                <div className="text-destructive flex items-center gap-1 text-base font-semibold md:text-lg">
                  <AlertTriangle className="text-destructive h-5 w-5" />
                  <p>สต็อกหมด</p>
                </div>
              ) : minStockLevel !== undefined &&
                minStockLevel !== null &&
                Number(quantity) < Number(minStockLevel) ? (
                <div className="text-status-progress flex items-center gap-1 text-base font-semibold md:text-lg">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="line-clamp-1">{`จำนวน: ${formatQuantity(quantity)} ${unit || ""}`}</p>
                </div>
              ) : (
                <p className="text-subtle-dark text-base font-semibold md:text-lg">
                  {`จำนวน: ${formatQuantity(quantity)} ${unit}`}
                </p>
              ))}
            {soldPriceRange && (
              <p className="text-subtle-dark truncate text-base font-semibold md:text-lg">
                {`เคยขาย ${formatPriceRange(soldPriceRange)}`}
              </p>
            )}
          </div>
        </div>

        <p className="text-primary shrink-0 text-[22px] font-semibold text-nowrap md:text-2xl">
          {formatCurrency(Number(sellingPrice))}
        </p>
      </div>
    </div>
  );
};
export default InventoryCard;
