import { useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams, Link } from "react-router";
import { useDebouncedCallback } from "use-debounce";
import { LoaderCircle, RotateCcw } from "lucide-react";
import InventoryCard from "@/components/cards/InventoryCard";
import SearchBar from "@/components/forms/SearchBar";
import CategoryList from "@/components/CategoryList";
import RepairItemDetailDialog from "@/components/dialogs/RepairItemDetailDialog";
import ComboBox from "@/components/ui/ComboBox";
import { listInventory } from "@/api/inventory";
import { listParts } from "@/api/part";
import { listCategories } from "@/api/category";
import { BoxSearch } from "@/components/icons/Icons";
import { toastError } from "@/utils/handleError";
import { onKeyActivate } from "@/utils/a11y";

const InventoryList = () => {
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [inventory, setInventory] = useState([]);
  const [tireBrand, setTireBrand] = useState("");
  const [width, setWidth] = useState("");
  const [aspectRatio, setAspectRatio] = useState("");
  const [rimDiameter, setRimDiameter] = useState("");
  const [partsList, setPartsList] = useState([]);
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedItem, setSelectedItem] = useState(null);
  const [isItemDetailOpen, setIsItemDetailOpen] = useState(false);
  const isInitializing = useRef(false);

  const category = searchParams.get("category");
  const search = searchParams.get("search");

  const buildFilterParams = () =>
    activeCategory === "ยาง"
      ? { width, aspectRatio, rimDiameter, brand: tireBrand }
      : {};

  const debouncedFilter = useDebouncedCallback(() => {
    const params = buildFilterParams();
    handleFilter(category, search, params);
  }, 500);

  const uniqSorted = (arr = []) =>
    Array.from(new Set(arr)).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );

  const isTirePart = (p) => p?.category?.name === "ยาง";

  // ตัวเลือกของแต่ละช่องกรองด้วย "ช่องอื่นทั้งหมด" ยกเว้นตัวเอง เพื่อให้เลือกช่องไหนก่อนก็ได้
  const tireParts = useMemo(() => partsList.filter(isTirePart), [partsList]);

  const matchesExcept = (p, except, sel) =>
    (except === "width" ||
      !sel.width ||
      String(p.attributes?.width) === String(sel.width)) &&
    (except === "aspectRatio" ||
      !sel.aspectRatio ||
      String(p.attributes?.aspectRatio) === String(sel.aspectRatio)) &&
    (except === "rimDiameter" ||
      !sel.rimDiameter ||
      String(p.attributes?.rimDiameter) === String(sel.rimDiameter)) &&
    (except === "brand" ||
      !sel.brand ||
      String(p.brand || "").trim() === String(sel.brand));

  const {
    widthOptions,
    aspectRatioOptions,
    rimDiameterOptions,
    availableTireBrands,
  } = useMemo(() => {
    const sel = { width, aspectRatio, rimDiameter, brand: tireBrand };
    const optionsFor = (field) =>
      uniqSorted(
        tireParts
          .filter((p) => matchesExcept(p, field, sel))
          .map((p) =>
            ((field === "brand" ? p.brand : p.attributes?.[field]) ?? "")
              .toString()
              .trim(),
          )
          .filter((v) => v !== ""),
      );

    return {
      widthOptions: optionsFor("width"),
      aspectRatioOptions: optionsFor("aspectRatio"),
      rimDiameterOptions: optionsFor("rimDiameter"),
      availableTireBrands: optionsFor("brand"),
    };
  }, [tireParts, width, aspectRatio, rimDiameter, tireBrand]);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (isInitializing.current) return;
    isInitializing.current = true;

    // กลับมาจากหน้าเพิ่ม/แก้ไขพร้อม ?category= -> คงหมวดหมู่เดิมไว้
    if (category) {
      setActiveCategory(category);
      handleFilter(category, null);
    } else {
      setSearchParams(new URLSearchParams());
      setActiveCategory("ทั้งหมด");
      handleFilter(null, null);
    }

    setTimeout(() => {
      isInitializing.current = false;
    }, 200);
  }, []);

  useEffect(() => {
    if (isInitializing.current) return;

    if (activeCategory !== "ยาง") {
      setTireBrand("");
      setWidth("");
      setAspectRatio("");
      setRimDiameter("");
    }

    if (activeCategory === "ยาง") {
      debouncedFilter();
    } else {
      handleFilter(category || null, search || null, {});
    }
  }, [category, search]);

  const handleFilter = async (category, search, filterParams = {}) => {
    setIsLoading(true);
    try {
      const res = await listInventory(category, search, filterParams);
      const data = res.data || [];

      setInventory(data);
    } catch (error) {
      toastError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [partsRes, categoriesRes] = await Promise.all([
          listParts(),
          listCategories(),
        ]);
        if (!mounted) return;
        setPartsList(partsRes.data || []);
        setCategoryOrder(
          [...(categoriesRes.data || [])]
            .sort((a, b) => a.id - b.id)
            .map((c) => c.name),
        );
      } catch (error) {
        toastError(error, "โหลดรายการอะไหล่ไม่สำเร็จ");
        setPartsList([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // หมวด "ทั้งหมด" แยกหัวข้อตามหมวดหมู่ เรียงกลุ่มให้ตรงกับแถบหมวดหมู่ด้านบน
  const inventoryGroups = useMemo(() => {
    if (activeCategory !== "ทั้งหมด") return null;

    const groups = new Map();
    for (const item of inventory) {
      const name = item.category?.name || "อื่นๆ";
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(item);
    }

    const rank = (name) => {
      const i = categoryOrder.indexOf(name);
      return i === -1 ? categoryOrder.length : i;
    };

    return [...groups.entries()]
      .map(([name, items]) => ({ name, items }))
      .sort((a, b) => rank(a.name) - rank(b.name));
  }, [inventory, activeCategory, categoryOrder]);

  const handleStockUpdate = () => {
    const filterParams =
      activeCategory === "ยาง"
        ? { width, aspectRatio, rimDiameter, brand: tireBrand }
        : {};
    handleFilter(category, search, filterParams);
  };

  const hasTireFilter = !!(width || aspectRatio || rimDiameter || tireBrand);

  const handleResetTireFilter = () => {
    debouncedFilter.cancel();
    setWidth("");
    setAspectRatio("");
    setRimDiameter("");
    setTireBrand("");
    handleFilter(category, search, {
      width: "",
      aspectRatio: "",
      rimDiameter: "",
      brand: "",
    });
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setIsItemDetailOpen(true);
  };

  const renderItem = (item) => (
    <div
      key={`${item.category.name}-${item.id}`}
      role="button"
      tabIndex={0}
      onKeyDown={onKeyActivate(() => handleItemClick(item))}
      onClick={() => handleItemClick(item)}
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
        tireLots={item.tireLots}
        secureUrl={item.secureUrl}
        category={item.category.name}
        onStockUpdate={handleStockUpdate}
      />
    </div>
  );

  return (
    <div className="bg-gradient-primary shadow-primary h-[87px] w-full">
      <div className="flex items-center gap-[8px] pt-[16px] pl-[20px]">
        <div className="bg-surface/20 flex h-[40px] w-[40px] items-center justify-center rounded-full">
          <BoxSearch color="#ffffff" />
        </div>
        <div>
          <p className="text-surface text-2xl font-semibold md:text-[26px]">
            อะไหล่และบริการ
          </p>
        </div>
      </div>

      <div className="bg-surface shadow-primary mt-[16px] min-h-[calc(100vh-65px)] w-full rounded-tl-2xl rounded-tr-2xl pb-[112px] xl:pb-[16px]">
        <div className="px-[20px] pt-[16px]">
          {/* แถบค้นหา */}
          <SearchBar placeholder="ค้นหารหัส, ยี่ห้อ, ชื่ออะไหล่" />

          {/* แถบหมวดหมู่ */}
          <CategoryList
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />

          {activeCategory === "ยาง" && (
            <div className="mt-[16px] flex w-full flex-col gap-[12px]">
              <div>
                <div className="mb-[8px] flex items-center justify-between">
                  <span className="text-xl font-medium md:text-[22px]">
                    ยี่ห้อ
                  </span>
                  {hasTireFilter && (
                    <button
                      type="button"
                      onClick={handleResetTireFilter}
                      className="text-destructive flex cursor-pointer items-center gap-[4px] text-lg font-semibold md:text-xl"
                    >
                      <RotateCcw className="h-4 w-4" />
                      ล้างตัวกรอง
                    </button>
                  )}
                </div>
                <ComboBox
                  options={[...availableTireBrands.map((b) => ({ name: b }))]}
                  value={tireBrand}
                  onChange={(v) => {
                    setTireBrand(v);
                    debouncedFilter();
                  }}
                  placeholder="-- เลือกยี่ห้อ --"
                  customClass="text-lg md:text-xl"
                />
              </div>
              <div className="grid grid-cols-3 gap-[8px]">
                <ComboBox
                  label="หน้ายาง"
                  options={[...widthOptions.map((p) => ({ name: p }))]}
                  value={width}
                  onChange={(v) => {
                    setWidth(v);
                    debouncedFilter();
                  }}
                  placeholder="มม."
                  searchable={false}
                  customClass="text-lg md:text-xl"
                  labelClass="text-xl md:text-[22px]"
                />
                <ComboBox
                  label="แก้มยาง"
                  options={[...aspectRatioOptions.map((p) => ({ name: p }))]}
                  value={aspectRatio}
                  onChange={(v) => {
                    setAspectRatio(v);
                    debouncedFilter();
                  }}
                  placeholder="%"
                  searchable={false}
                  customClass="text-lg md:text-xl"
                  labelClass="text-xl md:text-[22px]"
                />
                <ComboBox
                  label="ขอบ"
                  options={[...rimDiameterOptions.map((p) => ({ name: p }))]}
                  value={rimDiameter}
                  onChange={(v) => {
                    setRimDiameter(v);
                    debouncedFilter();
                  }}
                  placeholder="นิ้ว"
                  searchable={false}
                  customClass="text-lg md:text-xl"
                  labelClass="text-xl md:text-[22px]"
                />
              </div>
            </div>
          )}
          <div className="mt-[16px] flex items-center justify-between gap-[8px]">
            <p className="text-xl font-semibold md:text-[22px]">
              {activeCategory === "ทั้งหมด"
                ? "รายการอะไหล่และบริการ"
                : activeCategory}
              {!isLoading && (
                <span className="text-subtle-light ml-[6px] font-medium">
                  ({inventory.length})
                </span>
              )}
            </p>
            <Link
              to={
                activeCategory && activeCategory !== "ทั้งหมด"
                  ? `/inventory/new?category=${encodeURIComponent(activeCategory)}`
                  : "/inventory/new"
              }
              className="text-primary cursor-pointer text-xl font-semibold md:text-[22px]"
            >
              + เพิ่มรายการ
            </Link>
          </div>

          {/* รายการอะไหล่และบริการ */}
          {isLoading ? (
            <div className="flex h-[346px] items-center justify-center">
              <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : inventory.length === 0 ? (
            <div className="flex h-[346px] items-center justify-center">
              <p className="text-subtle-light text-xl font-medium md:text-[22px]">
                ไม่พบอะไหล่และบริการ
              </p>
            </div>
          ) : inventoryGroups ? (
            inventoryGroups.map((group) => (
              <div key={group.name}>
                <div className="mt-[16px] flex items-center gap-[8px]">
                  <p className="text-subtle-dark text-lg font-semibold md:text-xl">
                    {group.name}
                  </p>
                  <span className="text-subtle-light text-lg md:text-xl">
                    ({group.items.length})
                  </span>
                  <div className="bg-subtle-light/40 h-px flex-1" />
                </div>
                {group.items.map(renderItem)}
              </div>
            ))
          ) : (
            inventory.map(renderItem)
          )}
        </div>
      </div>
      <RepairItemDetailDialog
        item={selectedItem}
        open={isItemDetailOpen}
        onOpenChange={setIsItemDetailOpen}
        onStockUpdate={handleStockUpdate}
      />
    </div>
  );
};
export default InventoryList;
