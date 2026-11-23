import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ChevronLeft } from "lucide-react";
import PageSpinner from "@/components/ui/PageSpinner";
import InventoryCard from "@/components/cards/InventoryCard";
import RepairItemDetailDialog from "@/components/dialogs/RepairItemDetailDialog";
import { listImageIssues, listInventory } from "@/api/inventory";
import { listCategories } from "@/api/category";
import { SERVICE_CATEGORY, USED_TIRE_CATEGORY } from "@/constants/categories";
import { onKeyActivate } from "@/utils/a11y";
import { toastError } from "@/utils/handleError";

const TABS = [
  {
    id: "image",
    label: "รูปภาพ",
    empty: "ไม่มีรูปที่ต้องแก้ไข",
  },
  {
    id: "min-stock",
    label: "สต็อกขั้นต่ำ",
    empty: "ไม่มีอะไหล่ที่สต็อกขั้นต่ำไม่เท่ากับจำนวนสต็อก",
  },
];

const keyOf = (item) => `${item.type}-${item.id}`;

const InventoryReview = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((item) => item.id === searchParams.get("tab"))
    ? searchParams.get("tab")
    : TABS[0].id;
  const [inventory, setInventory] = useState(null);
  const [imageIssueKeys, setImageIssueKeys] = useState(null);
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    Promise.all([listInventory(null, null), listImageIssues()])
      .then(([inventoryRes, issuesRes]) => {
        setInventory(inventoryRes.data || []);
        setImageIssueKeys(new Set((issuesRes.data || []).map(keyOf)));
      })
      .catch(toastError);
  }, [reloadToken]);

  useEffect(() => {
    listCategories()
      .then((res) =>
        setCategoryOrder(
          [...(res.data || [])]
            .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
            .map((category) => category.name),
        ),
      )
      .catch(() => {});
  }, []);

  const isLoading = !inventory || !imageIssueKeys;
  const lists = isLoading
    ? { image: [], "min-stock": [] }
    : {
        image: inventory.filter((item) => imageIssueKeys.has(keyOf(item))),
        // ชุดน้ำมันนับสต็อกจากขวดน้ำมัน ยางเปอร์เซ็นต์ไม่ตั้งขั้นต่ำ จึงไม่ต้องตรวจ
        "min-stock": inventory.filter(
          (item) =>
            item.type === "part" &&
            !item.oilSourceId &&
            item.category?.name !== USED_TIRE_CATEGORY &&
            Number(item.minStockLevel || 0) !== Number(item.stockQuantity || 0),
        ),
      };
  const current = TABS.find((item) => item.id === tab);
  const items = lists[tab];

  const rank = (name) => {
    const index = categoryOrder.indexOf(name);
    return index === -1 ? categoryOrder.length : index;
  };
  const groups = [];
  for (const item of [...items].sort(
    (a, b) => rank(a.category?.name) - rank(b.category?.name),
  )) {
    const name = item.category?.name || "อื่นๆ";
    const last = groups[groups.length - 1];
    if (last?.name === name) last.items.push(item);
    else groups.push({ name, items: [item] });
  }

  return (
    <div className="bg-gradient-primary shadow-primary desktop-column flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-4">
        <button
          type="button"
          onClick={() =>
            window.history.length > 1 ? navigate(-1) : navigate("/inventory")
          }
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface min-w-0 flex-1 truncate text-2xl font-semibold md:text-[26px]">
          รายการที่ต้องตรวจสอบ
        </p>
      </div>

      <div className="mt-4 flex justify-center gap-4 px-5">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set("tab", item.id);
              setSearchParams(next, { replace: true });
            }}
            className={`flex h-[45px] min-w-36 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 px-4 text-lg font-semibold duration-300 md:text-xl ${
              tab === item.id
                ? "text-surface bg-primary border-white"
                : "border-subtle-light text-subtle-light bg-surface"
            }`}
          >
            {item.label}
            {!isLoading && ` (${lists[item.id].length})`}
          </button>
        ))}
      </div>

      <div className="bg-surface shadow-primary mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl px-5 pb-28 xl:pb-4">
        {isLoading ? (
          <PageSpinner />
        ) : items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-subtle-light px-5 text-center text-xl text-balance md:text-[22px]">
              {current.empty}
            </p>
          </div>
        ) : (
          <>
            {groups.map((group) => (
              <div key={group.name}>
                <div className="mt-4 flex items-center gap-2">
                  <p className="text-subtle-dark text-lg font-semibold md:text-xl">
                    {group.name}
                  </p>
                  <span className="text-subtle-light text-lg md:text-xl">
                    ({group.items.length})
                  </span>
                  <div className="bg-subtle-light/40 h-px flex-1" />
                </div>
                {group.items.map((item) => (
                  <div
                    key={keyOf(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={onKeyActivate(() => setSelectedItem(item))}
                    onClick={() => setSelectedItem(item)}
                    className="mt-4 cursor-pointer rounded-lg"
                  >
                    <InventoryCard
                      item={item}
                      brand={item.brand}
                      name={item.name}
                      unit={item.unit}
                      sellingPrice={item.sellingPrice}
                      quantity={item.stockQuantity}
                      minStockLevel={item.minStockLevel}
                      attributes={item.attributes}
                      secureUrl={item.secureUrl}
                      category={
                        item.type === "service"
                          ? SERVICE_CATEGORY
                          : item.category?.name
                      }
                      soldPriceRange={item.soldPriceRange}
                      oilSource={item.oilSource}
                      showMinStock={tab === "min-stock"}
                    />
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>

      <RepairItemDetailDialog
        item={selectedItem}
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
        onStockUpdate={() => setReloadToken((n) => n + 1)}
      />
    </div>
  );
};

export default InventoryReview;
