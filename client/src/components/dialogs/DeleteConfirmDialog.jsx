import { X } from "lucide-react";
import { useState } from "react";
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
  message = "คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?",
  itemName = "",
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

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
        className="flex flex-col w-full p-0"
        showCloseButton={false}
      >
        <div className="relative flex-shrink-0 pt-[16px]">
          <DialogTitle className="font-athiti font-semibold text-center text-[22px] md:text-[24px] text-subtle-dark">
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
            className="absolute top-[16px] right-[20px] flex items-center justify-center w-[32px] h-[32px] rounded-full bg-black/5"
          >
            <X size={18} className="text-subtle-dark" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 flex flex-col font-athiti px-[20px] py-[16px]">
          <div className="text-center">
            <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark">
              {message}
            </p>

            {itemName && (
              <div className="mt-4 flex items-center justify-center">
                <span className="inline-block px-4 py-2 rounded-full font-semibold text-[18px] md:text-[20px] text-primary bg-primary/10">
                  {itemName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ส่วนท้าย */}
        <div className="flex-shrink-0 px-[16px] pb-[16px]">
          <div className="flex gap-[16px]">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="flex-1 flex items-center justify-center h-[41px] rounded-[20px] font-athiti text-[18px] md:text-[20px] font-semibold text-subtle-dark bg-gray-100 hover:bg-gray-200"
            >
              ยกเลิก
            </button>
            <FormButton
              label="ลบ"
              isLoading={isLoading}
              disabled={isLoading}
              onClick={handleConfirm}
              className="flex-1 ml-0 mr-0 font-athiti bg-delete"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
