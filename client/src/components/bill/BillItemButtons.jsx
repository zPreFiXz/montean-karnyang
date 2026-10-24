import { ArrowUpDown, Gift } from "lucide-react";

export const FreebieButton = ({ bill }) =>
  bill.canAddFreebies && (
    <button
      type="button"
      onClick={bill.handleAddFreebies}
      disabled={bill.isAddingFreebies}
      aria-label="เพิ่มของแถม"
      title="เพิ่มของแถม"
      className="text-primary border-primary/40 bg-primary/5 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border duration-300 disabled:opacity-60"
    >
      <Gift className="h-4 w-4" />
    </button>
  );

// มีรายการเดียวไม่มีอะไรให้สลับ
export const ReorderButton = ({ bill, label = "จัดเรียงรายการซ่อม" }) =>
  bill.repairItems.length > 1 && (
    <button
      type="button"
      onClick={() => bill.setIsReordering((prev) => !prev)}
      aria-pressed={bill.isReordering}
      aria-label={bill.isReordering ? "ออกจากโหมดจัดเรียง" : label}
      className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border duration-300 ${
        bill.isReordering
          ? "bg-primary border-primary text-surface"
          : "text-subtle-dark border-gray-200 bg-gray-100"
      }`}
    >
      <ArrowUpDown className="h-4 w-4" />
    </button>
  );
