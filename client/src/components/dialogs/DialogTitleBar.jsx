import { X } from "lucide-react";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";

// description อ่านได้เฉพาะโปรแกรมอ่านหน้าจอ
const DialogTitleBar = ({ title, description, onClose, leftSlot = null }) => (
  <div className="relative mt-4 flex min-h-11 flex-shrink-0 items-center justify-center px-16">
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
      className="absolute top-1/2 right-5 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/5"
    >
      <X size={20} className="text-subtle-dark" />
    </button>
  </div>
);

export default DialogTitleBar;
