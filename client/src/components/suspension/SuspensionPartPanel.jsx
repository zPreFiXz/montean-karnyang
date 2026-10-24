import GroupHeading from "@/components/suspension/GroupHeading";
import PerSideServiceCard from "@/components/suspension/PerSideServiceCard";
import SuspensionPartCard from "@/components/suspension/SuspensionPartCard";
import { groupOtherParts, groupPartsByType } from "@/utils/suspension";

// ข้อความว่างอยู่นิ่ง อนิเมชันใส่เฉพาะตอนมีรายการ เพื่อบอกว่าเนื้อหาเปลี่ยนตอนสลับแท็บ
const SuspensionPartPanel = ({
  side,
  slideFrom,
  tabs,
  perSideService,
  emptyMessage,
  onSwitchToGeneral,
  onPreview,
  onEditPrice,
}) => {
  const parts = tabs.getPartsForSide(side);
  const groups =
    side === "other" ? groupOtherParts(parts) : groupPartsByType(parts);
  const showService =
    perSideService && (side === "left" || side === "right") && parts.length > 0;

  return (
    <div
      className={`w-full ${
        parts.length === 0
          ? ""
          : `animate-in fade-in duration-300 ease-out ${
              slideFrom === "right"
                ? "slide-in-from-right-16"
                : "slide-in-from-left-16"
            }`
      }`}
    >
      {parts.length === 0 ? (
        <div className="flex h-57 flex-col items-center justify-center gap-4 px-5">
          <p className="text-subtle-light text-center text-xl text-balance md:text-[22px]">
            {emptyMessage}
          </p>
          {onSwitchToGeneral && (
            <button
              type="button"
              onClick={onSwitchToGeneral}
              className="border-primary text-primary bg-surface flex h-[41px] cursor-pointer items-center justify-center rounded-[20px] border px-5 text-lg font-semibold md:text-xl"
            >
              เปลี่ยนเป็นงานซ่อมทั่วไป
            </button>
          )}
        </div>
      ) : (
        groups.map((group) => (
          <div key={`${side}-${group.type}`}>
            <GroupHeading title={group.type} count={group.items.length} />
            {group.items.map((part) => (
              <SuspensionPartCard
                key={`${side}-${part.id}`}
                part={part}
                side={side}
                tabs={tabs}
                onPreview={onPreview}
                onEditPrice={onEditPrice}
              />
            ))}
          </div>
        ))
      )}

      {showService && (
        <div>
          <GroupHeading title="บริการ" count={1} />
          <PerSideServiceCard
            service={perSideService}
            selected={tabs.perSideServiceSides[side]}
            onToggle={() => tabs.togglePerSideService(side)}
          />
        </div>
      )}
    </div>
  );
};

export default SuspensionPartPanel;
