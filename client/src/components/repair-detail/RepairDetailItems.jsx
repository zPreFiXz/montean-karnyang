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
  splitSuspensionBlocks,
} from "@/utils/repairItemGroups";

// rows ใช้กับรายการซ่อมเพิ่มเติมที่มีฝั่ง (เช่น ผ้าเบรก L) หัวข้อไม่ได้บอกฝั่งจึงต้องมีป้ายบนการ์ด
const ItemGroup = ({
  icon: Icon,
  title,
  items = [],
  rows = items.map((item) => ({ item })),
  keyPrefix,
  onItemClick,
}) =>
  rows.length > 0 && (
    <div className="mb-2">
      <p className="text-primary mb-2 flex items-center gap-1 text-xl font-semibold md:text-[22px]">
        <Icon className="mt-0.5" />
        {title}
      </p>
      <div className="space-y-3">
        {rows.map(({ item, sideLabel }, idx) => (
          <RepairItemCard
            key={`${keyPrefix}-${idx}`}
            item={item}
            variant="detail"
            sideLabel={sideLabel}
            onClick={() => onItemClick(item)}
          />
        ))}
      </div>
    </div>
  );

const RepairDetailItems = ({ repair, canEdit, onEdit, onItemClick }) => {
  const items = repair.repairItems || [];
  const blocks =
    repair.type === "SUSPENSION"
      ? splitSuspensionBlocks(items, repair.vehicle?.vehicleModel)
      : null;
  const groups = blocks ? groupSuspensionDetailItems(blocks.tabItems) : null;
  const extrasGroup = (extras, keyPrefix) => (
    <ItemGroup
      icon={Wrench}
      title="รายการซ่อมเพิ่มเติม"
      rows={mergeSidesInOrder(extras)}
      keyPrefix={keyPrefix}
      onItemClick={onItemClick}
    />
  );

  return (
    <div className="mb-4 px-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-normal text-[22px] font-semibold md:text-2xl">
          รายการซ่อม
        </p>
        {canEdit && (
          <button
            onClick={onEdit}
            className="text-primary flex cursor-pointer items-center gap-1 text-xl font-semibold md:text-[22px]"
          >
            <Edit className="h-5 w-5" />
            แก้ไขรายการซ่อม
          </button>
        )}
      </div>
      {groups ? (
        <div className="space-y-4">
          <div>
            {extrasGroup(blocks.before, "extra-before")}
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
            {extrasGroup(blocks.after, "extra-after")}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
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
