import { Image } from "lucide-react";

const InventoryCard = ({
  brand,
  name,
  unit,
  sellingPrice,
  stockQuantity,
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
        <p className="font-semibold text-[14px] text-normal">
          {brand} {typeSpecificData.width}/{typeSpecificData.aspectRatio}R
          {typeSpecificData.rimDiameter} {name}
        </p>
      );
      // แสดงข้อมูลยางที่ไม่มีขนาดแก้มยาง
    } else if (isTire && typeSpecificData) {
      return (
        <p className="font-semibold text-[14px] text-normal">
          {brand} {typeSpecificData.width}R{typeSpecificData.rimDiameter} {name}
        </p>
      );
    }

    // แสดงข้อมูลอะไหล่หรือบริการ
    return (
      <p className="font-semibold text-[14px] text-normal">
        {brand} {name}
      </p>
    );
  };

  return (
    <div className="flex items-center gap-[16px] mt-[16px]">
      <div className="flex justify-between items-center w-full h-[80px] px-[8px] rounded-[10px] bg-white shadow-primary">
        <div className="flex items-center gap-[8px]">
          <div className="flex items-center justify-center w-[60px] h-[60px] rounded-[10px] border border-subtle-light bg-white shadow-primary">
            {/* แสดงรูปภาพถ้ามี ถ้าไม่มีให้แสดงไอคอน Image */}
            {secureUrl ? (
              <img
                src={secureUrl}
                alt={name}
                className="object-cover w-full h-full rounded-[10px]"
              />
            ) : (
              <div className="flex items-center justify-center w-[60px] h-[60px] text-subtle-light">
                <Image className="w-8 h-8" />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            {renderProductInfo()}
            <p className="font-semibold text-[14px] text-subtle-dark">
              {isService ? "" : `จำนวน: ${stockQuantity} ${unit}`}
            </p>
          </div>
        </div>
        <p className="font-semibold text-[18px] text-primary text-nowrap">
          {sellingPrice} บาท
        </p>
      </div>
    </div>
  );
};
export default InventoryCard;
