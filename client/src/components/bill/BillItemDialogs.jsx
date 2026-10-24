import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import EditQuantityDialog from "@/components/dialogs/EditQuantityDialog";
import OilUsePickDialog from "@/components/dialogs/OilUsePickDialog";
import SidePickDialog from "@/components/dialogs/SidePickDialog";
import { allowsDecimalQuantity } from "@/constants/categories";
import { getProductName } from "@/utils/billItems";
import { oilUsesOf } from "@/utils/oil";

const BillItemDialogs = ({ bill }) => {
  const { oilUseItem, sidePickItem, quantityItem, removingIndex } = bill;
  const removingItem =
    removingIndex !== null ? bill.repairItems[removingIndex] : null;

  return (
    <>
      <OilUsePickDialog
        isOpen={!!oilUseItem}
        onClose={() => bill.setOilUseItem(null)}
        onPick={bill.handlePickOilUse}
        itemName={getProductName(oilUseItem)}
        uses={oilUseItem ? oilUsesOf(oilUseItem) : []}
      />
      <SidePickDialog
        isOpen={!!sidePickItem}
        onClose={() => bill.setSidePickItem(null)}
        onPick={bill.handlePickSide}
        itemName={getProductName(sidePickItem)}
        remaining={bill.remainingStockOf(sidePickItem)}
      />
      <EditQuantityDialog
        isOpen={!!quantityItem}
        onClose={() => bill.setQuantityItem(null)}
        onConfirm={bill.handleSetQuantity}
        currentQuantity={quantityItem?.item?.quantity ?? 1}
        productName={getProductName(quantityItem?.item)}
        unit={quantityItem?.item?.unit || ""}
        maxQuantity={bill.maxQuantityOf(quantityItem?.item)}
        allowDecimal={allowsDecimalQuantity(quantityItem?.item)}
      />
      <ConfirmDialog
        isOpen={removingIndex !== null}
        onClose={() => bill.setRemovingIndex(null)}
        onConfirm={bill.handleRemoveItem}
        title="ยืนยันการเอารายการออก"
        // ยังไม่ได้บันทึกลงระบบ ไม่ต้องกดค้าง
        requireHold={false}
        itemName={getProductName(removingItem)}
      />
    </>
  );
};

export default BillItemDialogs;
