import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

// อะไหล่ที่ตั้งไว้ว่าแยกซ้าย-ขวา ถามฝั่งตอนหยิบลงบิล แทนการพิมพ์ (L) (R) ต่อท้ายชื่อเอง
// แตะตัวเลือกแล้วจบเลย ไม่ต้องกดยืนยันอีกรอบ เพราะเลือกผิดก็ลบบรรทัดแล้วเลือกใหม่ได้
// ป้ายในวงเล็บตรงกับที่ใบเสร็จต่อท้ายให้ ช่างเห็นแล้วรู้ว่าจะออกมาแบบไหน
const OPTIONS = [
  { value: "left", label: "ซ้าย", code: "L" },
  { value: "right", label: "ขวา", code: "R" },
  { value: "both", label: "ทั้งสองข้าง", code: "R-L", needs: 2 },
];

const SidePickDialog = ({ isOpen, onClose, onPick, itemName, remaining }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent
      className="flex max-h-[85svh] w-full flex-col p-0"
      showCloseButton={false}
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <div className="relative mt-[16px] flex min-h-[44px] flex-shrink-0 items-center justify-center px-[64px]">
        <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-medium md:text-2xl">
          เลือกข้าง
        </DialogTitle>
        <DialogDescription className="sr-only">
          เลือกข้างของ {itemName}
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
          {OPTIONS.map((option) => {
            // ทั้งสองข้างใช้สองชิ้น สต็อกเหลือชิ้นเดียวเลือกไม่ได้
            const isDisabled =
              option.needs != null &&
              remaining != null &&
              remaining < option.needs;

            return (
              <button
                key={option.value}
                type="button"
                disabled={isDisabled}
                onClick={() => onPick(option.value)}
                className="flex flex-1 cursor-pointer flex-col items-center gap-[4px] rounded-[10px] border border-gray-200 bg-gray-50 px-[8px] py-[16px] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="text-primary text-lg font-semibold md:text-xl">
                  {option.label}
                </span>
                <span className="text-subtle-light text-base font-medium md:text-lg">
                  ({option.code})
                </span>
              </button>
            );
          })}
        </div>

        {remaining != null && remaining < 2 && (
          <p className="text-subtle-light mt-[8px] text-center text-base font-medium md:text-lg">
            สต็อกเหลือไม่พอสำหรับทั้งสองข้าง
          </p>
        )}
      </div>
    </DialogContent>
  </Dialog>
);

export default SidePickDialog;
