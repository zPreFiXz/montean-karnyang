import { Image, Wrench, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/utils/formats";
import { tracksStock } from "@/utils/stock";

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
  // หน้าจอที่ยึดสต็อกจริงล้วน (เช่นไดอะล็อกเลือกอะไหล่ลงบิล) ให้เตือน "สต็อกหมด" เมื่อเหลือ 0
  // แม้อะไหล่ตัวนั้นจะไม่ได้ตั้งสต็อกขั้นต่ำไว้ก็ตาม เพราะเบิกไม่ได้อยู่ดี
  alwaysWarnEmpty = false,
}) => {
  const isTire = category === "ยาง";
  const isService = category === "บริการ";

  const renderProductInfo = () => {
    if (isTire && attributes && attributes.aspectRatio) {
      return (
        <p className="text-normal line-clamp-2 overflow-hidden text-base font-semibold md:text-lg">
          {brand} {attributes.width}/{attributes.aspectRatio}R
          {attributes.rimDiameter} {name}
        </p>
      );
    } else if (isTire && attributes) {
      return (
        <p className="text-normal line-clamp-2 overflow-hidden text-base font-semibold md:text-lg">
          {brand} {attributes.width}R{attributes.rimDiameter} {name}
        </p>
      );
    }

    return (
      <p className="text-normal line-clamp-2 overflow-hidden text-base font-semibold md:text-lg">
        {brand} {name}
      </p>
    );
  };

  return (
    // ระยะห่างระหว่างการ์ดอยู่บนตัวที่รับคลิก ไม่ใช่ที่นี่ ไม่งั้นช่องว่างจะกดได้ด้วย
    <div className="flex items-center gap-[16px]">
      <div className="shadow-primary bg-surface flex h-[80px] w-full items-center justify-between gap-[8px] rounded-[10px] px-[8px]">
        <div className="flex items-center gap-[8px]">
          <div className="shadow-primary bg-surface flex items-center justify-center rounded-[10px] border border-gray-200">
            {secureUrl ? (
              <div className="h-[60px] w-[60px]">
                <img
                  src={secureUrl}
                  alt={name}
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
            {renderProductInfo()}

            {!isService &&
              (!alwaysWarnEmpty && !tracksStock(minStockLevel) ? (
                <p className="text-subtle-dark text-base font-semibold md:text-lg">
                  {`จำนวน: ${quantity} ${unit}`}
                </p>
              ) : quantity === 0 ? (
                <div className="text-destructive flex items-center gap-[4px] text-base font-semibold md:text-lg">
                  <AlertTriangle className="text-destructive h-5 w-5" />
                  <p>สต็อกหมด</p>
                </div>
              ) : minStockLevel !== undefined &&
                minStockLevel !== null &&
                Number(quantity) < Number(minStockLevel) ? (
                <div className="text-status-progress flex items-center gap-[4px] text-base font-semibold md:text-lg">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="line-clamp-1">{`จำนวน: ${Number(quantity)} ${unit || ""}`}</p>
                </div>
              ) : (
                <p className="text-subtle-dark text-base font-semibold md:text-lg">
                  {`จำนวน: ${quantity} ${unit}`}
                </p>
              ))}
          </div>
        </div>

        <p className="text-primary text-[22px] font-semibold text-nowrap md:text-2xl">
          {formatCurrency(Number(sellingPrice))}
        </p>
      </div>
    </div>
  );
};
export default InventoryCard;
