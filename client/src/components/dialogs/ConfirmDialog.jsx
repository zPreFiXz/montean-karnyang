import { X } from "lucide-react";
import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import FormButton from "../forms/FormButton";
import { toastError } from "@/utils/handleError";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "ยืนยันการลบ",
  // หัวเรื่องบอกว่าลบอะไร ชิปบอกว่าลบตัวไหน เนื้อหาบอกผลที่ตามมา — ไม่ซ้ำกัน
  message = "การลบไม่สามารถกู้คืนได้",
  itemName = "",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const cancelButtonRef = useRef(null);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } catch (error) {
      toastError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex max-h-[85svh] w-full flex-col p-0"
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          if (
            cancelButtonRef.current &&
            typeof cancelButtonRef.current.focus === "function"
          ) {
            cancelButtonRef.current.focus();
          } else if (e?.target && typeof e.target.focus === "function") {
            e.target.focus();
          }
        }}
      >
        <div className="relative flex-shrink-0 pt-[16px]">
          <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-semibold md:text-2xl">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {`${title}: ${message} ${itemName}`}
          </DialogDescription>
          <button
            onClick={onClose}
            autoFocus={false}
            tabIndex={-1}
            aria-label="ปิดหน้าต่าง"
            className="absolute top-[16px] right-[20px] flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-black/5"
          >
            <X size={18} className="text-subtle-dark" />
          </button>
        </div>

        <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-[20px]">
          <div className="text-center">
            {/* คำเตือนอยู่ก่อน: ข้อความเทาตัวเล็กถ้าไปอยู่ล่างสุดติดปุ่มจะถูกกวาดตาข้าม
                ส่วนชิปมีพื้นสีเด่นอยู่แล้ว วางท้ายก็ยังเห็น และอยู่ติดปุ่มพอดีตอนจะกด */}
            <p className="text-subtle-light text-base font-medium md:text-lg">
              {message}
            </p>

            {itemName && (
              <div className="mt-[12px] flex items-center justify-center">
                <span className="text-primary bg-primary/10 inline-block rounded-[10px] px-4 py-2 text-lg font-semibold md:text-xl">
                  {itemName}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 px-[16px] pb-[16px]">
          <div className="flex gap-[16px]">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="font-athiti border-subtle-light bg-surface text-subtle-dark flex h-[41px] flex-1 cursor-pointer items-center justify-center rounded-[20px] border text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-70 md:text-xl"
              ref={cancelButtonRef}
            >
              ยกเลิก
            </button>

            <FormButton
              label="ลบ"
              isLoading={isLoading}
              disabled={isLoading}
              onClick={handleConfirm}
              className="font-athiti bg-destructive mr-0 ml-0 flex-1"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
