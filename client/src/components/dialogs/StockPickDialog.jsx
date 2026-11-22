import { useEffect, useState } from "react";
import InventoryBrowser from "@/components/inventory/InventoryBrowser";
import DialogTitleBar from "@/components/dialogs/DialogTitleBar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { isPartPlaceholderItem } from "@/constants/services";

// เลือกอะไหล่จากสต็อกเพื่อรับเข้า (เช่น อะไหล่ที่รับจากร้านค้า) ไม่ใช่เบิกออก ของหมดก็เลือกได้
// บริการกับชุดน้ำมัน (สต็อกคิดจากขวดน้ำมัน) รับเข้าไม่ได้ จึงเป็นการ์ดจาง
// ยกเว้นอะไหล่อื่นๆ ไว้พิมพ์ชื่อของที่ไม่มีในคลัง
const StockPickDialog = ({ isOpen, onClose, onPick, title }) => {
  const [reloadToken, setReloadToken] = useState(0);

  // เปิดใหม่ทุกครั้งโหลดสต็อกล่าสุด จำนวนบนการ์ดจะตรงกับหลังรับของรอบก่อน
  useEffect(() => {
    if (isOpen) setReloadToken((n) => n + 1);
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex h-[90svh] w-full flex-col p-0"
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitleBar
          title={title}
          description="เลือกอะไหล่จากสต็อก"
          onClose={onClose}
        />
        <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-5 pt-1 pb-4">
          <InventoryBrowser
            incremental
            reloadToken={reloadToken}
            onItemClick={(item) => onPick(item)}
            getCardProps={(item) => ({
              disabled: isPartPlaceholderItem(item)
                ? false
                : item.type !== "part" || !!item.oilSourceId,
            })}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockPickDialog;
