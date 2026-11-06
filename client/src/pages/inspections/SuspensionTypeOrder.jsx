import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, ChevronLeft, ChevronUp } from "lucide-react";
import PageSpinner from "@/components/ui/PageSpinner";
import { listInventory } from "@/api/inventory";
import {
  getSuspensionTypeOrder,
  updateSuspensionTypeOrder,
} from "@/api/suspensionTypeOrder";
import { setCachedTypeOrder } from "@/hooks/useSuspensionTypeOrder";
import { SUSPENSION_CATEGORY } from "@/constants/categories";
import {
  DEFAULT_TYPE_ORDER,
  compareTypesBy,
  getPartType,
  isPerSide,
} from "@/utils/suspension";
import { toastError } from "@/utils/handleError";
import { withViewTransition } from "@/utils/viewTransition";

// ซ้ายกับขวามีชนิดอะไหล่ชุดเดียวกันเสมอ จึงเรียงรวมเป็นกลุ่มเดียว
const GROUPS = [
  { id: "side", title: "ซ้าย-ขวา" },
  { id: "other", title: "อื่นๆ" },
];

// รายการหัวข้อมาจากอะไหล่ช่วงล่างที่มีในคลังจริง เรียงตามลำดับที่ร้านจัดไว้
const typesOf = (parts, perSide, order) => {
  const types = new Set(
    parts
      .filter((part) => isPerSide(part.attributes) === perSide)
      .map((part) => getPartType(part.name)),
  );
  return (
    [...types]
      .sort(compareTypesBy(order))
      .map((type) => ({ type }))
      // ชื่อภาษาไทยใช้เป็นชื่อ view transition ไม่ได้ จึงใช้ลำดับตอนโหลดซึ่งไม่เปลี่ยนตอนสลับ
      .map((item, index) => ({
        ...item,
        key: `${perSide ? "side" : "other"}-${index}`,
      }))
  );
};

const SuspensionTypeOrder = () => {
  const navigate = useNavigate();
  const [lists, setLists] = useState(null);

  useEffect(() => {
    Promise.all([
      listInventory(SUSPENSION_CATEGORY, null),
      getSuspensionTypeOrder().catch(() => ({ data: DEFAULT_TYPE_ORDER })),
    ])
      .then(([inventoryRes, orderRes]) => {
        const parts = (inventoryRes.data || []).filter(
          (item) => item.type === "part",
        );
        // ยังไม่เคยจัดเรียงกลุ่มไหน ใช้ลำดับตั้งต้นเหมือนหน้าเช็กช่วงล่าง (ดู useSuspensionTypeOrder)
        const saved = orderRes.data || {};
        const order = {
          side: saved.side?.length ? saved.side : DEFAULT_TYPE_ORDER.side,
          other: saved.other?.length ? saved.other : DEFAULT_TYPE_ORDER.other,
        };
        setLists({
          side: typesOf(parts, true, order.side),
          other: typesOf(parts, false, order.other),
        });
      })
      .catch(toastError);
  }, []);

  const move = async (group, index, direction) => {
    const items = lists[group];
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const reordered = [...items];
    [reordered[index], reordered[target]] = [
      reordered[target],
      reordered[index],
    ];
    const next = { ...lists, [group]: reordered };
    // อัปเดตหน้าจอทันทีไม่ต้องรอเซิร์ฟเวอร์ ไม่งั้นกดเลื่อนรัวๆ จะกระตุก
    withViewTransition(() => setLists(next));
    setCachedTypeOrder({
      side: next.side.map((item) => item.type),
      other: next.other.map((item) => item.type),
    });
    try {
      await updateSuspensionTypeOrder(
        group,
        reordered.map((item) => item.type),
      );
    } catch (error) {
      toastError(error);
    }
  };

  const moveButtonClass =
    "text-subtle-dark bg-surface flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface text-2xl font-semibold md:text-[26px]">
          เรียงลำดับอะไหล่ช่วงล่าง
        </p>
      </div>
      <div className="bg-surface shadow-primary mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl pb-28 xl:pb-4">
        {!lists ? (
          <PageSpinner />
        ) : (
          <div className="space-y-4 px-5 pt-4">
            {GROUPS.map((group) => (
              <div
                key={group.id}
                className="bg-surface shadow-primary rounded-lg p-4"
              >
                <p className="text-primary mb-4 border-b border-gray-100 pb-4 text-xl font-semibold md:text-[22px]">
                  {group.title}
                </p>
                {lists[group.id].length === 0 ? (
                  <p className="text-subtle-light py-4 text-center text-lg md:text-xl">
                    ไม่มีอะไหล่ช่วงล่าง
                  </p>
                ) : (
                  <div className="space-y-2">
                    {lists[group.id].map((item, index, items) => (
                      <div
                        key={item.type}
                        style={{ viewTransitionName: `type-${item.key}` }}
                        className="flex items-center justify-between gap-3 rounded-md bg-gray-50 p-2"
                      >
                        <p className="text-normal min-w-0 truncate pl-1 text-lg font-medium md:text-xl">
                          {item.type}
                        </p>
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => move(group.id, index, -1)}
                            disabled={index === 0}
                            aria-label={`เลื่อน ${item.type} ขึ้น`}
                            className={moveButtonClass}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => move(group.id, index, 1)}
                            disabled={index === items.length - 1}
                            aria-label={`เลื่อน ${item.type} ลง`}
                            className={moveButtonClass}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuspensionTypeOrder;
