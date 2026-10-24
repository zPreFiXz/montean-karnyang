import {
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  TicketPercent,
  Trash2,
  Wrench,
} from "lucide-react";
import CollapsibleRow from "@/components/ui/CollapsibleRow";
import ProductName from "@/components/bill/ProductName";
import SideBadge from "@/components/bill/SideBadge";
import { SparePart } from "@/components/icons/Icons";
import { onKeyActivate } from "@/utils/a11y";
import { formatCurrency, formatQuantity } from "@/utils/formats";
import { getProductName, stepOf } from "@/utils/billItems";
import {
  hasTypedUnit,
  isDiscountItem,
  isPartLikeItem,
  isSingleQuantityItem,
} from "@/constants/services";

const stop = (handler) => (e) => {
  e.stopPropagation();
  handler();
};

const ItemIcon = ({ item }) => {
  if (isDiscountItem(item)) return <TicketPercent className="h-9 w-9" />;
  if (!item.partNumber && !isPartLikeItem(item)) {
    return <Wrench className="h-9 w-9" />;
  }
  return <SparePart className="h-10 w-10" />;
};

const MoveButtons = ({ index, total, onMove }) => (
  <div className="flex shrink-0 items-center gap-2">
    <button
      type="button"
      onClick={stop(() => onMove(index, -1))}
      disabled={index === 0}
      aria-label="เลื่อนขึ้น"
      className="text-subtle-dark flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <ChevronUp className="h-4 w-4" />
    </button>
    <button
      type="button"
      onClick={stop(() => onMove(index, 1))}
      disabled={index === total - 1}
      aria-label="เลื่อนลง"
      className="text-subtle-dark flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <ChevronDown className="h-4 w-4" />
    </button>
  </div>
);

const QuantityControls = ({ item, index, bill }) => {
  const isLastStep = item.quantity <= stepOf(item);

  return (
    <div
      className="flex shrink-0 items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={stop(() =>
          isLastStep
            ? bill.setRemovingIndex(index)
            : bill.handleDecreaseQuantity(index),
        )}
        aria-label={isLastStep ? "เอารายการออก" : "ลดจำนวน"}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-gray-100"
      >
        <Minus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={stop(() => bill.setQuantityItem({ index, item }))}
        aria-label={`แก้ไขจำนวนของ ${getProductName(item)}`}
        className="text-primary min-w-7 cursor-pointer text-lg font-semibold md:text-xl"
      >
        {formatQuantity(item.quantity)}
      </button>
      <button
        type="button"
        onClick={stop(() => bill.handleIncreaseQuantity(index))}
        disabled={bill.isAtStockLimit(item)}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-gray-100 disabled:bg-gray-50 disabled:text-gray-300"
      >
        <Plus className="h-4 w-4" />
      </button>
      {/* อะไหล่อื่นๆ กับบริการอื่นๆ ไม่มีหน่วยในคลัง ช่างพิมพ์เองต่อท้ายจำนวน */}
      {hasTypedUnit(item) && (
        <input
          type="text"
          value={item.unit || ""}
          onChange={(e) => bill.handleUnitChange(index, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          maxLength={20}
          placeholder="หน่วย"
          aria-label={`หน่วยของ ${getProductName(item)}`}
          className="text-subtle-dark placeholder:text-subtle-light bg-surface focus:border-primary ml-1 h-9 w-11 shrink-0 rounded-md border border-gray-200 px-1 text-center text-base font-medium outline-none md:text-lg"
        />
      )}
    </div>
  );
};

// transitionPrefix ต้องไม่ซ้ำกับชื่ออนิเมชันในส่วนอื่นของหน้า
const BillItemRows = ({ bill, onRowClick, transitionPrefix }) => {
  const { repairItems, itemKey, isReordering } = bill;

  return repairItems.map((item, index) => {
    // โหมดจัดเรียงให้กดได้แค่ลูกศร
    const openRow = () => {
      if (!isReordering) onRowClick(index, item);
    };
    const hasNoQuantity = isDiscountItem(item) || isSingleQuantityItem(item);

    return (
      <CollapsibleRow
        key={itemKey(item)}
        leaving={bill.leavingIndex === index}
        onLeaveEnd={bill.handleLeaveEnd}
      >
        <div
          data-repair-row={index}
          style={{
            viewTransitionName: `${transitionPrefix}-${itemKey(item)}`,
          }}
          className="mt-4 px-5"
        >
          <div
            role="button"
            tabIndex={0}
            onKeyDown={onKeyActivate(openRow)}
            onClick={openRow}
            className="shadow-primary bg-surface relative flex h-23 w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="shadow-primary bg-surface relative flex h-15 w-15 shrink-0 items-center justify-center rounded-lg border border-gray-200">
                <SideBadge side={item.side} />
                {item.secureUrl ? (
                  <img
                    src={item.secureUrl}
                    alt={item.name}
                    className="h-full w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="text-subtle-light flex h-15 w-15 items-center justify-center">
                    <ItemIcon item={item} />
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <ProductName item={item} />
                {!hasNoQuantity && (
                  <p className="text-subtle-light truncate text-base leading-tight font-medium md:text-lg">
                    {formatCurrency(Number(item.sellingPrice))}
                    {item.unit ? `/${item.unit}` : ""}
                  </p>
                )}
                <div className="flex w-full items-center justify-between">
                  <p className="text-primary min-w-0 truncate text-xl leading-tight font-semibold text-nowrap md:text-[22px]">
                    {formatCurrency(item.quantity * item.sellingPrice)}
                  </p>
                  {isReordering ? (
                    <MoveButtons
                      index={index}
                      total={repairItems.length}
                      onMove={bill.handleMoveItem}
                    />
                  ) : hasNoQuantity ? (
                    <button
                      type="button"
                      onClick={stop(() => bill.setRemovingIndex(index))}
                      aria-label="เอารายการออก"
                      className="bg-destructive text-surface absolute top-1/2 right-2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  ) : (
                    <QuantityControls item={item} index={index} bill={bill} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleRow>
    );
  });
};

export default BillItemRows;
