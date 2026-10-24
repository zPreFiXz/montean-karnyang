import DialogTitleBar from "@/components/dialogs/DialogTitleBar";
import DescriptionNote from "@/components/ui/DescriptionNote";
import { SparePart } from "@/components/icons/Icons";
import { formatCurrency } from "@/utils/formats";
import { isPartLikeItem } from "@/constants/services";
import { isTireCategoryName, USED_TIRE_CATEGORY } from "@/constants/categories";
import { formatProductName } from "@/utils/tireSize";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// ไม่ใช้ RepairItemDetailDialog เพราะตัวนั้นมีปุ่มเพิ่มสต็อก/แก้ไข/ลบ
// onOpenStock = เปิดรายละเอียดของชิ้นนี้ในคลัง ไม่ส่งมาก็ไม่มีปุ่ม
const PartPreviewDialog = ({
  part,
  price,
  open,
  onOpenChange,
  onOpenStock,
}) => {
  if (!part) return null;

  const isService = part.category?.name === "บริการ" && !isPartLikeItem(part);

  // ชื่อในคลังเก็บแค่รุ่น ("MA579") ต้องประกอบยี่ห้อกับขนาดยางเข้าไป
  const displayName = formatProductName({
    brand: part.brand,
    name: part.name,
    attributes: part.attributes,
    isTire: isTireCategoryName(part.category?.name),
    isUsedTire: part.category?.name === USED_TIRE_CATEGORY,
  });

  const hasAdjustedPrice =
    price != null && Number(price) !== Number(part.sellingPrice);
  const priceDiff = Number(price) - Number(part.sellingPrice);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90svh] w-full flex-col p-0"
        showCloseButton={false}
      >
        <DialogTitleBar
          title={<>รายละเอียด{isService ? "บริการ" : "อะไหล่"}</>}
          description={<>ข้อมูลของ {displayName}</>}
          onClose={() => onOpenChange(false)}
        />

        <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-5 pb-4">
          <h2 className="text-normal text-center text-[22px] leading-tight font-semibold break-words md:text-2xl">
            {displayName}
          </h2>

          {!isService && (
            <div className="mt-4 flex justify-center">
              <div className="border-input flex aspect-square w-full max-w-70 items-center justify-center overflow-hidden rounded-[20px] border-2">
                {part.secureUrl ? (
                  <img
                    src={part.secureUrl}
                    alt={displayName}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <SparePart className="text-subtle-light h-20 w-20" />
                )}
              </div>
            </div>
          )}

          {part.description && (
            <DescriptionNote text={part.description} className="mt-4" />
          )}

          <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-4">
            {part.partNumber && (
              <div className="flex justify-between gap-3">
                <p className="text-subtle-dark shrink-0 text-lg font-medium md:text-xl">
                  รหัสอะไหล่:
                </p>
                <p className="text-normal min-w-0 text-right text-lg font-semibold break-words md:text-xl">
                  {part.partNumber}
                </p>
              </div>
            )}

            {hasAdjustedPrice && (
              <div className="flex justify-between gap-3">
                <p className="text-subtle-dark shrink-0 text-lg font-medium md:text-xl">
                  ราคาปกติ:
                </p>
                <p className="text-subtle-dark min-w-0 text-right text-lg font-semibold md:text-xl">
                  {formatCurrency(Number(part.sellingPrice) || 0)}
                </p>
              </div>
            )}

            {/* ราคาที่จะใช้จริง (รวมที่ปรับไว้) จึงรับจากหน้าที่เรียก ไม่อ่าน part.sellingPrice */}
            <div className="flex justify-between gap-3">
              <p className="text-subtle-dark shrink-0 text-lg font-medium md:text-xl">
                {hasAdjustedPrice ? "ราคาที่ปรับ:" : "ราคาต่อหน่วย:"}
              </p>
              <p className="text-primary min-w-0 text-right text-lg font-semibold md:text-xl">
                {formatCurrency(Number(price ?? part.sellingPrice) || 0)}
                {hasAdjustedPrice && (
                  <span className="text-subtle-dark font-medium">
                    {" "}
                    ({priceDiff < 0 ? "ลด" : "เพิ่ม"}{" "}
                    {formatCurrency(Math.abs(priceDiff))})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {onOpenStock && (
          <div className="flex-shrink-0 px-4 pb-4">
            <button
              type="button"
              onClick={onOpenStock}
              className="font-athiti text-primary border-primary bg-surface flex h-11 w-full cursor-pointer items-center justify-center rounded-[20px] border text-lg font-semibold md:text-xl"
            >
              ดูในสต็อก
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PartPreviewDialog;
