import { AlertTriangle, Minus, Plus, SquarePen } from "lucide-react";
import ProductName from "@/components/bill/ProductName";
import SelectCheck from "@/components/suspension/SelectCheck";
import { SparePart } from "@/components/icons/Icons";
import { onKeyActivate } from "@/utils/a11y";
import { formatCurrency } from "@/utils/formats";

const SuspensionPartCard = ({ part, side, tabs, onPreview, onEditPrice }) => {
  const selected = tabs.isPartSelected(part.id, side);
  const allowedUnits = tabs.getAllowedUnitsForPart(part);
  const selectedAll = tabs.getCurrentSelectedCountForPart(part);
  const isDisabled = !selected && selectedAll >= allowedUnits;
  const quantity = tabs.tabQty(side, part.id);

  const toggle = () => {
    if (isDisabled) return;
    tabs.handlePartSelection(part, !selected, side);
  };

  return (
    <div className="mt-4 px-5">
      <div
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-pressed={selected}
        aria-disabled={isDisabled || undefined}
        onKeyDown={onKeyActivate(toggle)}
        onClick={toggle}
        className={`shadow-primary flex min-h-20 w-full items-center justify-between gap-2 rounded-lg border-2 px-2 py-2 transition-colors duration-200 ${
          selected
            ? "bg-primary/5 border-primary"
            : "bg-surface border-transparent"
        } ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* ยังไม่เลือก = ดูรูปก่อนตัดสินใจ, เลือกแล้ว = แก้ราคา */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (selected) onEditPrice(part);
              else onPreview(part);
            }}
            aria-label={
              selected ? `แก้ไขราคา ${part.name}` : `ดูรูป ${part.name}`
            }
            className="shadow-primary bg-surface flex h-15 w-15 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200"
          >
            {part.secureUrl ? (
              <img
                src={part.secureUrl}
                alt={part.name}
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <div className="text-subtle-light flex h-15 w-15 items-center justify-center">
                <SparePart className="h-10 w-10" />
              </div>
            )}
          </button>

          <div className="flex min-w-0 flex-1 flex-col">
            <ProductName item={part} />
            {part.partNumber && (
              <p className="text-subtle-dark truncate text-base leading-tight font-medium md:text-lg">
                รหัสอะไหล่: {part.partNumber}
              </p>
            )}
            <div className="flex items-center gap-3">
              {/* สูง 44px ตามเป้ากดขั้นต่ำบนมือถือ กดพลาดตรงนี้จะกลายเป็นติ๊กเลือกอะไหล่ */}
              <button
                type="button"
                onClick={(e) => {
                  if (!selected) return;
                  e.stopPropagation();
                  onEditPrice(part);
                }}
                aria-label={
                  selected ? `แก้ไขราคา ${part.name}` : `ราคา ${part.name}`
                }
                className="-my-2 flex h-11 w-fit cursor-pointer items-center gap-2 self-start"
              >
                <span
                  className={`text-xl leading-tight font-semibold duration-200 md:text-[22px] ${
                    selected ? "text-primary" : "text-subtle-dark"
                  }`}
                >
                  {formatCurrency(tabs.getPriceForPart(part))}
                </span>
                {selected && (
                  <SquarePen className="text-primary h-5 w-5 shrink-0" />
                )}
              </button>
              {isDisabled && (
                <p className="text-destructive flex items-center gap-1 text-base leading-tight font-semibold md:text-lg">
                  <AlertTriangle className="text-destructive h-5 w-5" />
                  <span>สต็อกหมด</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* บูชปีกนกข้างหนึ่งใส่ได้หลายตัว ลดจนเหลือศูนย์ = เอาออก */}
        {selected && tabs.allowsTabQuantity(part) ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (quantity <= 1) {
                  tabs.handlePartSelection(part, false, side);
                  return;
                }
                tabs.setTabQty(side, part.id, quantity - 1);
              }}
              aria-label={quantity <= 1 ? "เอารายการออก" : "ลดจำนวน"}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-gray-100"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-primary min-w-7 text-center text-lg font-semibold md:text-xl">
              {quantity}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                tabs.setTabQty(side, part.id, quantity + 1);
              }}
              disabled={selectedAll >= allowedUnits}
              aria-label="เพิ่มจำนวน"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-gray-100 disabled:bg-gray-50 disabled:text-gray-300"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <SelectCheck selected={selected} />
        )}
      </div>
    </div>
  );
};

export default SuspensionPartCard;
