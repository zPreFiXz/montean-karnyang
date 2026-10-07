import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { OIL_USES } from "@/utils/oil";

// น้ำมันขวดลิตรตัวเดียวใช้ได้หลายงาน ถามตอนหยิบลงบิลว่าใช้เติมอะไร ชื่อในบิลจะได้บอกงานที่ทำ
// แตะแล้วจบเลยเหมือนหน้าต่างเลือกข้าง การ์ดตัวเลือกหน้าตาชุดเดียวกัน
const OilUsePickDialog = ({ isOpen, onClose, onPick, itemName }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent
      className="flex max-h-[85svh] w-full flex-col p-0"
      showCloseButton={false}
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <div className="relative mt-[16px] flex min-h-[44px] flex-shrink-0 items-center justify-center px-[64px]">
        <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-medium md:text-2xl">
          ใช้เติมอะไร
        </DialogTitle>
        <DialogDescription className="sr-only">
          เลือกงานที่ใช้ {itemName}
        </DialogDescription>
        <button
          onClick={onClose}
          aria-label="ปิดหน้าต่าง"
          className="absolute top-1/2 right-[20px] flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/5"
        >
          <X size={20} className="text-subtle-dark" />
        </button>
      </div>

      <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-[20px] pb-[20px]">
        {itemName && (
          <h2 className="text-normal text-center text-[22px] leading-tight font-semibold md:text-2xl">
            {itemName}
          </h2>
        )}

        <div className="mt-[16px] flex gap-[8px]">
          {OIL_USES.map((use) => (
            <button
              key={use}
              type="button"
              onClick={() => onPick(use)}
              className="active:border-primary active:bg-primary/5 text-primary flex flex-1 cursor-pointer items-center justify-center rounded-[10px] border border-gray-200 bg-gray-50 px-[4px] py-[20px] text-center text-lg leading-tight font-semibold duration-300 md:text-xl"
            >
              {use}
            </button>
          ))}
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default OilUsePickDialog;
