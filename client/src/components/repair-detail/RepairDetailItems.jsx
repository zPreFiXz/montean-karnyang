import {
  Edit,
  ArrowLeftRight,
  ArrowLeft,
  ArrowRight,
  Ellipsis,
  Wrench,
} from "lucide-react";
import RepairItemCard from "@/components/cards/RepairItemCard";
import {
  groupSuspensionDetailItems,
  mergeSidesInOrder,
} from "@/utils/repairItemGroups";

const ItemGroup = ({ icon: Icon, title, items, keyPrefix, onItemClick }) =>
  items.length > 0 && (
    <div className="mb-[8px]">
      <p className="text-primary mb-[8px] flex items-center gap-[4px] text-xl font-semibold md:text-[22px]">
        <Icon className="mt-[2px]" />
        {title}
      </p>
      <div className="space-y-[12px]">
        {items.map((item, idx) => (
          <RepairItemCard
            key={`${keyPrefix}-${idx}`}
            item={item}
            variant="detail"
            onClick={() => onItemClick(item)}
          />
        ))}
      </div>
    </div>
  );

const RepairDetailItems = ({ repair, canEdit, onEdit, onItemClick }) => {
  const items = repair.repairItems || [];
  const groups =
    repair.type === "SUSPENSION" ? groupSuspensionDetailItems(items) : null;

  return (
    <div className="mb-[16px] px-[20px]">
      <div className="mb-[8px] flex items-center justify-between">
        <p className="text-normal text-[22px] font-semibold md:text-2xl">
          รายการซ่อม
        </p>
        {canEdit && (
          <button
            onClick={onEdit}
            className="text-primary flex cursor-pointer items-center gap-[4px] text-xl font-semibold md:text-[22px]"
          >
            <Edit className="h-5 w-5" />
            แก้ไขรายการซ่อม
          </button>
        )}
      </div>
      {groups ? (
        <div className="space-y-[16px]">
          <div>
            <ItemGroup
              icon={ArrowLeftRight}
              title="รายการซ่อมข้างซ้าย-ขวา"
              items={groups.bothSides}
              keyPrefix="both"
              onItemClick={onItemClick}
            />
            <ItemGroup
              icon={ArrowLeft}
              title="รายการซ่อมข้างซ้าย"
              items={groups.leftOnly}
              keyPrefix="left"
              onItemClick={onItemClick}
            />
            <ItemGroup
              icon={ArrowRight}
              title="รายการซ่อมข้างขวา"
              items={groups.rightOnly}
              keyPrefix="right"
              onItemClick={onItemClick}
            />
            <ItemGroup
              icon={Ellipsis}
              title="รายการซ่อมอื่นๆ"
              items={groups.otherItems}
              keyPrefix="other"
              onItemClick={onItemClick}
            />
            <ItemGroup
              icon={Wrench}
              title="รายการซ่อมเพิ่มเติม"
              items={groups.generalItems}
              keyPrefix="general"
              onItemClick={onItemClick}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-[16px]">
          {mergeSidesInOrder(items).map(({ item, sideLabel }, index) => (
            <RepairItemCard
              key={index}
              item={item}
              variant="detail"
              sideLabel={sideLabel}
              onClick={() => onItemClick(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RepairDetailItems;
