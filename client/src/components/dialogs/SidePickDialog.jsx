import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

// อะไหล่หรือบริการที่ตั้งไว้ว่าแยกซ้าย-ขวา ถามข้างตอนหยิบลงบิล แทนการพิมพ์ (L) (R) ต่อท้ายชื่อเอง
// แตะตัวเลือกแล้วจบเลย ไม่ต้องกดยืนยันอีกรอบ เพราะเลือกผิดก็ลบบรรทัดแล้วเลือกใหม่ได้
// ป้ายเป็นตัวย่อเดียวกับที่ขึ้นบนการ์ดและใบเสร็จ การ์ดตัวเลือกหน้าตาเดียวกับหน้าต่างประเภทลูกค้า
// ไม่ใช้ลูกศร เพราะ L คือซ้ายของรถ ไม่ใช่ซ้ายของคนดู ช่างที่ยืนหันหน้าเข้าหารถ ลูกศรจะชี้ผิดข้าง
const OPTIONS = [
  { value: "left", code: "L" },
  { value: "right", code: "R" },
  { value: "both", code: "R-L", needs: 2 },
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
          {OPTIONS.map(({ value, code, needs }) => {
            // R-L ใช้สองชิ้น สต็อกเหลือชิ้นเดียวเลือกไม่ได้
            const isDisabled =
              needs != null && remaining != null && remaining < needs;

            return (
              <button
                key={value}
                type="button"
                disabled={isDisabled}
                onClick={() => onPick(value)}
                className="active:border-primary active:bg-primary/5 text-primary flex flex-1 cursor-pointer items-center justify-center rounded-[10px] border border-gray-200 bg-gray-50 py-[20px] text-[28px] leading-none font-semibold duration-300 disabled:cursor-not-allowed disabled:opacity-40 md:text-[32px]"
              >
                {code}
              </button>
            );
          })}
        </div>

        {remaining != null && remaining < 2 && (
          <p className="text-subtle-light mt-[8px] text-center text-base font-medium md:text-lg">
            สต็อกเหลือไม่พอสำหรับ R-L
          </p>
        )}

        {/* ใช้นานๆ ครั้ง (ขายหน้าร้านให้ลูกค้าไปใส่เอง) จึงเป็นปุ่มรองแบบปุ่มยกเลิก ไม่ใช่การ์ดใบที่สี่
            ลงบิลเป็นบรรทัดปกติ ไม่มีป้ายข้าง ใบเสร็จไม่ต่อท้ายอะไร */}
        <button
          type="button"
          onClick={() => onPick("none")}
          className="font-athiti bg-surface text-subtle-dark border-subtle-light mt-[16px] flex h-[41px] w-full cursor-pointer items-center justify-center rounded-[20px] border text-lg font-semibold md:text-xl"
        >
          ไม่ระบุข้าง
        </button>
      </div>
    </DialogContent>
  </Dialog>
);

export default SidePickDialog;
