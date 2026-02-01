import { Image, Wrench, AlertTriangle } from "lucide-react";

const InventoryCard = ({
  brand,
  name,
  unit,
  sellingPrice,
  stockQuantity,
  minStockLevel,
  typeSpecificData,
  secureUrl,
  category,
}) => {
  const isTire = category === "ยาง";
  const isService = category === "บริการ";

  const renderProductInfo = () => {
    // แสดงข้อมูลยางที่มีขนาดแก้มยาง
    if (isTire && typeSpecificData && typeSpecificData.aspectRatio) {
      return (
        <p className="text-normal line-clamp-2 overflow-hidden text-[16px] font-semibold md:text-[18px]">
          {brand} {typeSpecificData.width}/{typeSpecificData.aspectRatio}R
          {typeSpecificData.rimDiameter} {name}
        </p>
      );
      // แสดงข้อมูลยางที่ไม่มีขนาดแก้มยาง
    } else if (isTire && typeSpecificData) {
      return (
        <p className="text-normal line-clamp-2 overflow-hidden text-[16px] font-semibold md:text-[18px]">
          {brand} {typeSpecificData.width}R{typeSpecificData.rimDiameter} {name}
        </p>
      );
    }

    // แสดงข้อมูลอะไหล่หรือบริการ
    return (
      <p className="text-normal line-clamp-2 overflow-hidden text-[16px] font-semibold md:text-[18px]">
        {brand} {name}
      </p>
    );
  };

  return (
    <div className="mt-[16px] flex cursor-pointer items-center gap-[16px]">
      <div className="shadow-primary bg-surface flex h-[80px] w-full items-center justify-between gap-[8px] rounded-[10px] px-[8px]">
        <div className="flex items-center gap-[8px]">
          <div className="border-subtle-light shadow-primary bg-surface flex items-center justify-center rounded-[10px] border">
            {/* แสดงรูปภาพถ้ามี ถ้าไม่มีให้แสดงไอคอนตามประเภท */}
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
              // แสดงสถานะสต็อกหมด
              (stockQuantity === 0 ? (
                <div className="text-delete flex items-center gap-[4px] text-[16px] font-semibold md:text-[18px]">
                  <AlertTriangle className="text-delete h-5 w-5" />
                  <p>สต็อกหมด</p>
                </div>
              ) : // แสดงสถานะสต็อกถ้าน้อยกว่าหรือเท่ากับระดับสต็อกขั้นต่ำ
              minStockLevel !== undefined &&
                minStockLevel !== null &&
                Number(stockQuantity) <= Number(minStockLevel) ? (
                <div className="text-in-progress flex items-center gap-[4px] text-[16px] font-semibold md:text-[18px]">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="line-clamp-1">{`จำนวน: ${Number(stockQuantity)} ${unit || ""}`}</p>
                </div>
              ) : (
                // แสดงจำนวนสต็อกปกติ
                <p className="text-subtle-dark text-[16px] font-semibold md:text-[18px]">
                  {`จำนวน: ${stockQuantity} ${unit}`}
                </p>
              ))}
          </div>
        </div>
        <p className="text-primary text-[22px] font-semibold text-nowrap md:text-[24px]">
          {Number(sellingPrice).toLocaleString()} บาท
        </p>
      </div>
    </div>
  );
};
export default InventoryCard;
