import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import FormButton from "@/components/forms/FormButton";
import { formatQuantity } from "@/utils/formats";

// พิมพ์จำนวนเองแทนการกดปุ่มบวกทีละครั้ง — จำเป็นกับน้ำมันที่ขายเป็นลิตรครึ่งลิตร
// และเร็วกว่ามากเวลาขายของทีละหลายชิ้น
const EditQuantityDialog = ({
  isOpen,
  onClose,
  onConfirm,
  currentQuantity = 1,
  productName = "",
  unit = "",
  // เพดานตามสต็อกที่เบิกได้จริง ไม่ส่งมา = ไม่จำกัด (เช่นบริการ)
  maxQuantity,
  allowDecimal = false,
}) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setValue(formatQuantity(currentQuantity));
      setError("");
    }
  }, [isOpen, currentQuantity]);

  const handleConfirm = () => {
    const quantity = Number(value);

    if (!value.trim() || !Number.isFinite(quantity) || quantity <= 0) {
      setError("กรุณากรอกจำนวนที่มากกว่า 0");
      return;
    }
    if (!allowDecimal && !Number.isInteger(quantity)) {
      setError("จำนวนต้องเป็นจำนวนเต็ม");
      return;
    }
    if (maxQuantity != null && quantity > maxQuantity) {
      setError(`มีในสต็อก ${formatQuantity(maxQuantity)} ${unit}`.trim());
      return;
    }

    onConfirm(Number(quantity.toFixed(2)));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex max-h-[85svh] w-full flex-col p-0"
        showCloseButton={false}
      >
        <div className="relative mt-[16px] flex min-h-[44px] flex-shrink-0 items-center justify-center px-[64px]">
          <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-medium md:text-2xl">
            แก้ไขจำนวน
          </DialogTitle>
          <DialogDescription className="sr-only">
            แก้ไขจำนวนของ {productName}
          </DialogDescription>
          <button
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="absolute top-1/2 right-[20px] flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/5"
          >
            <X size={20} className="text-subtle-dark" />
          </button>
        </div>

        <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-[20px]">
          <h2 className="text-normal text-center text-[22px] leading-tight font-semibold break-words md:text-2xl">
            {productName}
          </h2>

          <div className="mt-[16px] rounded-[10px] bg-gray-50 p-[16px]">
            <label
              htmlFor="repair-item-quantity"
              className="text-subtle-dark mb-[8px] block text-lg font-medium md:text-xl"
            >
              จำนวน{unit ? ` (${unit})` : ""}
            </label>
            <input
              id="repair-item-quantity"
              // ใช้ช่องข้อความ ไม่ใช่ช่องตัวเลข เพราะช่องตัวเลขคืนค่าว่างระหว่างที่ยังพิมพ์ไม่จบ
              // พิมพ์ "3." แล้วเบราว์เซอร์มองว่ายังไม่เป็นตัวเลข ค่าที่อ่านได้เลยเป็นค่าว่าง
              // ตัวเลขที่พิมพ์ไปเลยหายทั้งบรรทัด — inputMode ยังเรียกแป้นตัวเลขให้เหมือนเดิม
              type="text"
              inputMode={allowDecimal ? "decimal" : "numeric"}
              value={value}
              placeholder={allowDecimal ? "เช่น 3.5" : "เช่น 2"}
              onChange={(e) => {
                // กรองที่เดียวตอนพิมพ์ ไม่แก้ค่าในช่องตรงๆ ไม่งั้นจะชนกับค่าที่ React ถืออยู่
                const cleaned = allowDecimal
                  ? e.target.value
                      .replace(/[^0-9.]/g, "")
                      .replace(/(\..*)\./g, "$1")
                  : e.target.value.replace(/[^0-9]/g, "");
                setValue(cleaned);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm();
              }}
              className={`bg-surface w-full rounded-[20px] border px-[12px] py-[8px] text-xl font-medium outline-none md:text-[22px] ${
                error
                  ? "border-destructive focus:border-destructive border-2"
                  : "border-input focus:border-primary focus:border-2"
              }`}
            />
            {error && (
              <p className="text-destructive mt-[6px] px-[4px] text-lg font-medium md:text-xl">
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 px-[16px] py-[16px]">
          <div className="flex gap-[16px]">
            <button
              type="button"
              onClick={onClose}
              className="font-athiti bg-surface text-subtle-dark border-subtle-light flex h-[41px] flex-1 cursor-pointer items-center justify-center rounded-[20px] border text-lg font-semibold md:text-xl"
            >
              ยกเลิก
            </button>
            <FormButton
              label="ยืนยัน"
              onClick={handleConfirm}
              className="font-athiti bg-gradient-primary mr-0 ml-0 flex-1"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditQuantityDialog;
