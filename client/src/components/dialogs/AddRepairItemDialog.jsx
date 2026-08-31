import { useState, useRef } from "react";
import InventoryBrowser from "@/components/inventory/InventoryBrowser";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

const AddRepairItemDialog = ({
  children,
  onAddItem,
  selectedItems = [],
  restoredStockMap = {},
  vehicle = null,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const restoredStockMapRef = useRef({});

  const buildPartKey = (item) =>
    `${item.partNumber || ""}|${item.brand || ""}|${item.name || ""}`;

  // เบิกได้ = สต็อกในคลัง + ของที่บิลนี้เคยเบิกไปแล้ว − ของที่อยู่ในบิลตอนนี้
  const getStockInfo = (item) => {
    const key = buildPartKey(item);
    const selectedQuantity = selectedItems.reduce((sum, selected) => {
      const isSamePart =
        selected.partNumber === item.partNumber &&
        selected.brand === item.brand &&
        selected.name === item.name;
      return isSamePart ? sum + (selected.quantity || 0) : sum;
    }, 0);

    const displayStock =
      (item.stockQuantity || 0) + (restoredStockMapRef.current[key] || 0);

    return { displayStock, remainingAddable: displayStock - selectedQuantity };
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    // เก็บภาพ ณ ตอนเปิด: จำนวนที่บิลนี้เคยเบิกไปแล้วและถูกหักออกจากคลังไปแล้ว (เฉพาะบิลที่บันทึกแล้ว)
    restoredStockMapRef.current = { ...restoredStockMap };
    setReloadToken((n) => n + 1);
  };

  const handleAddItemToRepair = (item) => {
    const { displayStock, remainingAddable } = getStockInfo(item);

    // กันไว้อีกชั้นเผื่อกดผ่านคีย์บอร์ด — เกณฑ์เดียวกับที่ใช้ปิดการ์ด
    if (item.partNumber && item.brand && remainingAddable <= 0) return;

    onAddItem({ ...item, quantity: displayStock });
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger onClick={handleOpenDialog} asChild>
        {children}
      </DialogTrigger>
      <DialogContent
        className="flex h-[90vh] max-h-[650px] w-full flex-col p-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader className="relative mt-[16px] flex min-h-[44px] flex-shrink-0 items-center justify-center px-[64px]">
          <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-medium md:text-2xl">
            เลือกอะไหล่หรือบริการ
          </DialogTitle>
          <DialogDescription className="sr-only">
            เลือกอะไหล่หรือบริการที่ต้องการเพิ่มลงในรายการซ่อม
          </DialogDescription>
          <button
            onClick={() => setIsDialogOpen(false)}
            autoFocus={false}
            aria-label="ปิดหน้าต่าง"
            className="absolute top-1/2 right-[20px] flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/5"
          >
            <X size={20} className="text-subtle-dark" />
          </button>
        </DialogHeader>

        <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-[20px] pt-[4px] pb-[16px]">
          <InventoryBrowser
            reloadToken={reloadToken}
            vehicle={vehicle}
            onItemClick={handleAddItemToRepair}
            getCardProps={(item) => {
              const { remainingAddable } = getStockInfo(item);
              return {
                // การ์ดในไดอะล็อกบอก "เบิกได้อีกเท่าไหร่" ไม่ใช่ "คลังมีเท่าไหร่"
                quantity: Math.max(remainingAddable, 0),
                alwaysWarnEmpty: true,
                disabled:
                  !!item.partNumber && !!item.brand && remainingAddable <= 0,
              };
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddRepairItemDialog;
