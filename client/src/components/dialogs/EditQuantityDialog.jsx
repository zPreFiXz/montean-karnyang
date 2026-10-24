import { useEffect, useState } from "react";
import DialogTitleBar from "@/components/dialogs/DialogTitleBar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import FormButton from "@/components/forms/FormButton";
import { formatQuantity } from "@/utils/formats";

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
        <DialogTitleBar
          title="แก้ไขจำนวน"
          description={<>แก้ไขจำนวนของ {productName}</>}
          onClose={onClose}
        />

        <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-5">
          <h2 className="text-normal text-center text-[22px] leading-tight font-semibold break-words md:text-2xl">
            {productName}
          </h2>

          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <label
              htmlFor="repair-item-quantity"
              className="text-subtle-dark mb-2 block text-lg font-medium md:text-xl"
            >
              จำนวน{unit ? ` (${unit})` : ""}
            </label>
            <input
              id="repair-item-quantity"
              // ช่องตัวเลขคืนค่าว่างระหว่างพิมพ์ไม่จบ ("3.") เลขที่พิมพ์จะหาย inputMode ยังเรียกแป้นตัวเลข
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
              className={`bg-surface w-full rounded-[20px] border px-3 py-2 text-xl font-medium outline-none md:text-[22px] ${
                error
                  ? "border-destructive focus:border-destructive border-2"
                  : "border-input focus:border-primary focus:border-2"
              }`}
            />
            {error && (
              <p className="text-destructive mt-1.5 px-1 text-lg font-medium md:text-xl">
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 px-4 py-4">
          <div className="flex gap-4">
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
