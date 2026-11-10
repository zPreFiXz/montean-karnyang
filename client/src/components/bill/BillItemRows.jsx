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
  ALIGNMENT_REDEEMED_NOTE,
} from "@/constants/services";
import ItemImage from "@/components/ui/ItemImage";

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

// แถวแทนก้อนรายการจากแท็บช่วงล่าง เลื่อนแทรกระหว่างรายการได้เหมือนรายการหนึ่ง
const MarkerRow = ({
  marker,
  position,
  total,
  isReordering,
  transitionPrefix,
}) => (
  <div
    style={{ viewTransitionName: `${transitionPrefix}-tab-block` }}
    className="mt-4 px-5"
  >
    <div className="border-primary/40 bg-primary/5 flex min-h-14 w-full items-center justify-between gap-2 rounded-lg border border-dashed px-3 py-2">
      <div className="text-primary flex min-w-0 items-center gap-2">
        {marker.icon}
        <p className="truncate text-lg font-semibold md:text-xl">
          {marker.label}
        </p>
      </div>
      {isReordering && (
        <MoveButtons
          index={position}
          total={total}
          onMove={(_, direction) => marker.onMoveMarker(direction)}
        />
      )}
    </div>
  </div>
);

// transitionPrefix ต้องไม่ซ้ำกับชื่ออนิเมชันในส่วนอื่นของหน้า
// marker = { index, label, icon, onMoveItem, onMoveMarker } แทรกแถวก้อนช่วงล่างก่อนรายการลำดับที่ index
const BillItemRows = ({ bill, onRowClick, transitionPrefix, marker }) => {
  const { repairItems, itemKey, isReordering } = bill;
  const total = repairItems.length + (marker ? 1 : 0);
  const markerRow = marker && (
    <MarkerRow
      key="tab-block"
      marker={marker}
      position={marker.index}
      total={total}
      isReordering={isReordering}
      transitionPrefix={transitionPrefix}
    />
  );

  const rows = repairItems.map((item, index) => {
    const position = marker && index >= marker.index ? index + 1 : index;
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
                <ItemImage
                  src={item.secureUrl}
                  alt={item.name}
                  className="h-full w-full rounded-lg object-cover"
                  fallback={
                    <div className="text-subtle-light flex h-15 w-15 items-center justify-center">
                      <ItemIcon item={item} />
                    </div>
                  }
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                {bill.canDeferAlignment(item) || item.alignmentFromRepairId ? (
                  // ตั้งศูนย์ฟรีจากยางสี่เส้น ช่วงล่างหลวมเปิดค้างไว้ให้รถคันนี้มาตั้งฟรีครั้งหน้า
                  // อยู่บรรทัดเดียวกับชื่อ การ์ดจะสูงเท่าการ์ดอื่น เว้นขวาไว้ไม่ชนปุ่มเอาออก
                  <div className="flex min-w-0 items-center gap-2 pr-12">
                    <p className="text-normal shrink-0 text-base leading-tight font-semibold md:text-lg">
                      {getProductName(item)}
                    </p>
                    {item.alignmentFromRepairId ? (
                      <span className="bg-status-paid/10 text-status-paid min-w-0 truncate rounded-full px-2.5 py-px text-sm font-semibold md:text-base">
                        {ALIGNMENT_REDEEMED_NOTE}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={stop(() =>
                          bill.toggleAlignmentDeferred(index),
                        )}
                        disabled={isReordering}
                        aria-pressed={!!item.alignmentDeferred}
                        className="flex min-w-0 cursor-pointer items-center gap-1.5 disabled:cursor-default"
                      >
                        <span
                          className={`flex h-5.5 w-9.5 shrink-0 items-center rounded-full p-[3px] transition-colors duration-300 ${
                            item.alignmentDeferred
                              ? "bg-status-progress"
                              : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`bg-surface h-4 w-4 rounded-full transition-transform duration-300 ${
                              item.alignmentDeferred
                                ? "translate-x-4"
                                : "translate-x-0"
                            }`}
                          />
                        </span>
                        <span
                          className={`truncate text-base font-semibold md:text-lg ${
                            item.alignmentDeferred
                              ? "text-status-progress"
                              : "text-subtle-dark"
                          }`}
                        >
                          {/* สวิตช์บอกสถานะอยู่แล้ว ข้อความคงเดิมแบบสวิตช์อื่น ข้อความเต็มอยู่บนใบเสร็จ */}
                          ค้างไว้ก่อน
                        </span>
                      </button>
                    )}
                  </div>
                ) : (
                  <ProductName item={item} />
                )}
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
                      index={position}
                      total={total}
                      onMove={(_, direction) =>
                        marker
                          ? marker.onMoveItem(index, direction)
                          : bill.handleMoveItem(index, direction)
                      }
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

  if (!markerRow) return rows;
  return [
    ...rows.slice(0, marker.index),
    markerRow,
    ...rows.slice(marker.index),
  ];
};

export default BillItemRows;
