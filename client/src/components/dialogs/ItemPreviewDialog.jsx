import { X, Check, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import DescriptionNote from "@/components/ui/DescriptionNote";
import { formatCurrency, formatQuantity } from "@/utils/formats";
import { isTireCategoryName, USED_TIRE_CATEGORY } from "@/constants/categories";
import { isPartLikeItem } from "@/constants/services";
import { formatProductName } from "@/utils/tireSize";

// การ์ดในหน้าต่างเลือกรายการตัดชื่อที่ 2 บรรทัด กดรูปเพื่อดูชื่อเต็มก่อนเลือก
// หน้าตาเดียวกับรายละเอียดอะไหล่ในหน้าคลัง แต่เหลือแค่ที่ใช้ตัดสินใจเลือก
// quantity = จำนวนที่เบิกได้ในบิลนี้ (null = ไม่ต้องบอก เช่น บริการ)
const ItemPreviewDialog = ({ item, quantity, canPick, onPick, onClose }) => {
  const category = item?.category?.name;
  const isService = category === "บริการ";
  const readsAsService = isService && !isPartLikeItem(item || {});
  const fullName = item
    ? formatProductName({
        brand: item.brand,
        name: item.name,
        attributes: item.attributes,
        isTire: isTireCategoryName(category),
        isUsedTire: category === USED_TIRE_CATEGORY,
      })
    : "";
  const amount = `${formatQuantity(quantity)} ${item?.unit || ""}`.trim();
  const stockStatus =
    quantity > 0
      ? { color: "bg-status-completed", Icon: Check, label: `จำนวน ${amount}` }
      : { color: "bg-destructive", Icon: AlertTriangle, label: "สต็อกหมด" };

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex max-h-[85svh] w-full flex-col p-0"
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="relative mt-[16px] flex min-h-[44px] flex-shrink-0 items-center justify-center px-[64px]">
          <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-medium md:text-2xl">
            รายละเอียด{readsAsService ? "บริการ" : "อะไหล่"}
          </DialogTitle>
          <DialogDescription className="sr-only">{fullName}</DialogDescription>
          <button
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="absolute top-1/2 right-[20px] flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/5"
          >
            <X size={20} className="text-subtle-dark" />
          </button>
        </div>

        <div className="font-athiti flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 px-[20px] pb-[16px]">
            <div className="mb-[16px]">
              <h2 className="text-normal text-center text-[22px] leading-tight font-semibold break-words md:text-2xl">
                {fullName}
              </h2>

              {quantity != null && (
                <div className="mt-[16px] flex justify-center">
                  <div
                    className={`text-surface ${stockStatus.color} flex h-[41px] w-fit items-center gap-2 rounded-[20px] px-[24px] text-base font-semibold md:text-lg`}
                  >
                    <stockStatus.Icon className="h-4 w-4" />
                    {stockStatus.label}
                  </div>
                </div>
              )}
            </div>

            {item?.secureUrl && (
              <div className="mb-[16px] flex justify-center">
                <div className="border-input flex aspect-square w-full max-w-[280px] items-center justify-center overflow-hidden rounded-[20px] border-2">
                  <img
                    src={item.secureUrl}
                    alt={item.name}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            )}

            {item?.description && <DescriptionNote text={item.description} />}

            <div className="mt-[16px] space-y-[8px] rounded-[10px] bg-gray-50 p-[16px]">
              {!isService && item?.partNumber && (
                <div className="flex justify-between">
                  <p className="text-subtle-dark text-lg font-medium md:text-xl">
                    รหัสอะไหล่:
                  </p>
                  <p className="text-normal text-lg font-semibold md:text-xl">
                    {item.partNumber}
                  </p>
                </div>
              )}
              <div className="flex justify-between">
                <p className="text-subtle-dark text-lg font-medium md:text-xl">
                  {isService ? "ราคา:" : "ราคาขาย:"}
                </p>
                <p className="text-primary text-lg font-semibold md:text-xl">
                  {formatCurrency(Number(item?.sellingPrice || 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-[16px] pb-[16px]">
          <button
            onClick={onPick}
            disabled={!canPick}
            className="font-athiti text-surface bg-gradient-primary flex h-11 w-full cursor-pointer items-center justify-center rounded-[20px] text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-40 md:text-xl"
          >
            เพิ่มลงรายการซ่อม
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemPreviewDialog;
