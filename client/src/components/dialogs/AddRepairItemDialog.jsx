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
import ItemPreviewDialog from "@/components/dialogs/ItemPreviewDialog";

const AddRepairItemDialog = ({
  children,
  onAddItem,
  selectedItems = [],
  restoredStockMap = {},
  vehicle = null,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [previewItem, setPreviewItem] = useState(null);
  const restoredStockMapRef = useRef({});

  // ผูกกับตัวอะไหล่ ไม่ใช่ชื่อ เพราะชื่อในบิลพิมพ์ทับได้ ใช้ชื่อแล้วจะนับสต็อกผิด
  const buildPartKey = (item) =>
    item.id != null
      ? `id:${item.id}`
      : `${item.partNumber || ""}|${item.brand || ""}|${item.name || ""}`;

  const isSamePart = (a, b) =>
    a.id != null && b.id != null
      ? a.id === b.id && !!a.partNumber === !!b.partNumber
      : a.partNumber === b.partNumber &&
        a.brand === b.brand &&
        a.name === b.name;

  // เบิกได้ = สต็อกในคลัง + ของที่บิลนี้เคยเบิกไปแล้ว − ของที่อยู่ในบิลตอนนี้
  const getStockInfo = (item) => {
    const key = buildPartKey(item);
    const selectedQuantity = selectedItems.reduce(
      (sum, selected) =>
        isSamePart(selected, item) ? sum + (selected.quantity || 0) : sum,
      0,
    );

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

  const isOutOfStock = (item) =>
    !!item.partNumber && getStockInfo(item).remainingAddable <= 0;

  const handleAddItemToRepair = (item) => {
    const { displayStock } = getStockInfo(item);

    // กันไว้อีกชั้นเผื่อกดผ่านคีย์บอร์ด — เกณฑ์เดียวกับที่ใช้ปิดการ์ด
    if (isOutOfStock(item)) return;

    onAddItem({ ...item, quantity: displayStock });
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger onClick={handleOpenDialog} asChild>
        {children}
      </DialogTrigger>
      <DialogContent
        className="flex h-[90vh] max-h-162.5 w-full flex-col p-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader className="relative mt-4 flex min-h-11 flex-shrink-0 items-center justify-center px-16">
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
            className="absolute top-1/2 right-5 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/5"
          >
            <X size={20} className="text-subtle-dark" />
          </button>
        </DialogHeader>

        <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-5 pt-1 pb-4">
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
                disabled: isOutOfStock(item),
                onImageClick: () => setPreviewItem(item),
              };
            }}
          />
        </div>
      </DialogContent>

      <ItemPreviewDialog
        item={previewItem}
        quantity={
          previewItem?.partNumber
            ? Math.max(getStockInfo(previewItem).remainingAddable, 0)
            : null
        }
        canPick={!!previewItem && !isOutOfStock(previewItem)}
        onPick={() => {
          const item = previewItem;
          setPreviewItem(null);
          handleAddItemToRepair(item);
        }}
        onClose={() => setPreviewItem(null)}
      />
    </Dialog>
  );
};

export default AddRepairItemDialog;
