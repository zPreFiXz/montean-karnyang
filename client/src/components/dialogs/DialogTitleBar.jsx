import { X } from "lucide-react";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";

// หัวหน้าต่างแบบเดียวกันทุกหน้าต่างในระบบ: ชื่อตรงกลาง ปุ่มปิดวงกลมทางขวา
// description อ่านได้เฉพาะโปรแกรมอ่านหน้าจอ leftSlot ไว้วางปุ่มเสริมทางซ้าย (เช่นประวัติการใช้)
const DialogTitleBar = ({ title, description, onClose, leftSlot = null }) => (
  <div className="relative mt-[16px] flex min-h-[44px] flex-shrink-0 items-center justify-center px-[64px]">
    <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-medium md:text-2xl">
      {title}
    </DialogTitle>
    <DialogDescription className="sr-only">{description}</DialogDescription>
    {leftSlot}
    <button
      type="button"
      onClick={onClose}
      autoFocus={false}
      aria-label="ปิดหน้าต่าง"
      className="absolute top-1/2 right-[20px] flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/5"
    >
      <X size={20} className="text-subtle-dark" />
    </button>
  </div>
);

export default DialogTitleBar;
