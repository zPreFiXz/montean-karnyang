import { X } from "lucide-react";
import { useState, useRef } from "react";
import { TIMING } from "@/utils/constants";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import FormButton from "../forms/FormButton";

const DeleteConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "ยืนยันการลบ",
  message = "ต้องการลบข้อมูลนี้หรือไม่?",
  itemName = "",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const cancelButtonRef = useRef(null);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, TIMING.LOADING_DELAY));

      await onConfirm();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex w-full flex-col p-0"
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
          <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-semibold md:text-[24px]">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {`${title}: ${message} ${itemName}`}
          </DialogDescription>

          {/* ปุ่มปิด dialog */}
          <button
            onClick={onClose}
            autoFocus={false}
            tabIndex={-1}
            aria-label="ปิดหน้าต่าง"
            className="absolute top-[16px] right-[20px] flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-full bg-black/5"
          >
            <X size={18} className="text-subtle-dark" />
          </button>
        </div>
        <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-[20px] py-[16px]">
          <div className="text-center">
            <p className="text-subtle-dark text-[18px] font-medium md:text-[20px]">
              {message}
            </p>

            {itemName && (
              <div className="mt-4 flex items-center justify-center">
                <span className="text-primary bg-primary/10 inline-block rounded-[10px] px-4 py-2 text-[18px] font-semibold md:text-[20px]">
                  {itemName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ปุ่มลบและยกเลิก */}
        <div className="flex-shrink-0 px-[16px] pb-[16px]">
          <div className="flex gap-[16px]">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="font-athiti text-subtle-dark flex h-[41px] flex-1 cursor-pointer items-center justify-center rounded-[20px] bg-gray-100 text-[18px] font-semibold md:text-[20px]"
              ref={cancelButtonRef}
            >
              ยกเลิก
            </button>
            <FormButton
              label="ลบ"
              isLoading={isLoading}
              disabled={isLoading}
              onClick={handleConfirm}
              className="font-athiti bg-delete mr-0 ml-0 flex-1"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
