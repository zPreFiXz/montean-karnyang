import PageSpinner from "@/components/ui/PageSpinner";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useDebouncedCallback } from "use-debounce";
import { X } from "lucide-react";
import InventoryCard from "@/components/cards/InventoryCard";
import SearchBar from "@/components/forms/SearchBar";
import CategoryList from "@/components/inventory/CategoryList";
import ComboBox from "@/components/ui/ComboBox";
import { listInventory } from "@/api/inventory";
import { listParts } from "@/api/part";
import { listCategories } from "@/api/category";
import { toastError } from "@/utils/handleError";
import { onKeyActivate } from "@/utils/a11y";
import { compareSuspensionTypes, getPartType } from "@/utils/suspension";
import {
  groupInventory,
  NO_CATEGORY_GROUP,
  oilGroupOf,
  oilGroupOptions,
  sortForCategory,
  uniqSorted,
} from "@/utils/inventoryGroups";
import {
  isTireCategoryName,
  OIL_CATEGORY,
  USED_TIRE_CATEGORY,
} from "@/constants/categories";

// จำผลค้นล่าสุดไว้นอกคอมโพเนนต์ กลับเข้าหน้าคลังจะได้มีของโชว์ตั้งแต่เฟรมแรก
const inventoryCache = new Map();
const cacheKey = (categoryName, searchTerm, filterParams) =>
  JSON.stringify([categoryName, searchTerm, filterParams]);
// ไม่จำไว้ กลับมาแล้วกลุ่มจะสลับที่ตอนลำดับหมวดโหลดเสร็จ
let partsListCache = null;
let categoryOrderCache = null;

// หน้าคลังกับไดอะล็อกเลือกอะไหล่ลงบิลใช้ร่วมกัน
// syncUrl = เก็บหมวดหมู่กับคำค้นไว้ใน URL (ไดอะล็อกไม่ใช้)
// reloadToken = เปลี่ยนค่าเมื่อไหร่ก็โหลดรายการใหม่
// getCardProps = props เพิ่มเติมของการ์ดแต่ละใบ
const InventoryBrowser = ({
  syncUrl = false,
  headerAction = null,
  onItemClick,
  getCardProps = () => ({}),
  reloadToken,
  onLoadingChange,
  vehicle = null,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [localCategory, setLocalCategory] = useState("ทั้งหมด");
  const [localSearch, setLocalSearch] = useState("");

  const initialTireFilter = (key) =>
    syncUrl ? searchParams.get(key) || "" : "";

  // กุญแจต้องประกอบแบบเดียวกับตอนโหลดจริงด้านล่าง
  const [initialCached] = useState(() => {
    const startCategory = syncUrl
      ? searchParams.get("category") || "ทั้งหมด"
      : "ทั้งหมด";
    const startSearch = syncUrl ? searchParams.get("search") : null;
    const filters = isTireCategoryName(startCategory)
      ? {
          width: initialTireFilter("width"),
          aspectRatio: initialTireFilter("aspectRatio"),
          rimDiameter: initialTireFilter("rimDiameter"),
          brand: initialTireFilter("brand"),
        }
      : {};
    return inventoryCache.get(
      cacheKey(
        startCategory === "ทั้งหมด" ? null : startCategory,
        startSearch,
        filters,
      ),
    );
  });

  const [inventory, setInventory] = useState(initialCached || []);
  const [partsList, setPartsList] = useState(partsListCache || []);
  const [categoryOrder, setCategoryOrder] = useState(categoryOrderCache || []);
  const [isLoading, setIsLoading] = useState(!initialCached);

  const [onlyMatchingVehicle, setOnlyMatchingVehicle] = useState(true);

  const [tireBrand, setTireBrand] = useState(() => initialTireFilter("brand"));
  const [width, setWidth] = useState(() => initialTireFilter("width"));
  const [aspectRatio, setAspectRatio] = useState(() =>
    initialTireFilter("aspectRatio"),
  );
  const [rimDiameter, setRimDiameter] = useState(() =>
    initialTireFilter("rimDiameter"),
  );
  const [partType, setPartType] = useState(() => initialTireFilter("partType"));
  const [oilSize, setOilSize] = useState(() => initialTireFilter("oilSize"));

  const activeCategory = syncUrl
    ? searchParams.get("category") || "ทั้งหมด"
    : localCategory;
  const search = syncUrl ? searchParams.get("search") : localSearch || null;
  const category = activeCategory === "ทั้งหมด" ? null : activeCategory;

  const isUsedTireCategory = activeCategory === USED_TIRE_CATEGORY;

  // เปลี่ยนจากหมวดยางมายางเปอร์เซ็นต์ ล้างยี่ห้อที่เลือกค้างไว้ ไม่งั้นตัวเลือกขนาดจะว่างหมด
  useEffect(() => {
    if (isUsedTireCategory && tireBrand) setTireBrand("");
  }, [isUsedTireCategory, tireBrand]);

  const buildFilterParams = (override = {}) =>
    isTireCategoryName(activeCategory)
      ? {
          width,
          aspectRatio,
          rimDiameter,
          brand: isUsedTireCategory ? "" : tireBrand,
          ...override,
        }
      : {};

  const handleFilter = async (categoryName, searchTerm, filterParams = {}) => {
    const key = cacheKey(categoryName, searchTerm, filterParams);
    const cached = inventoryCache.get(key);
    if (cached) {
      setInventory(cached);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
    try {
      const res = await listInventory(categoryName, searchTerm, filterParams);
      const data = res.data || [];
      inventoryCache.set(key, data);
      setInventory(data);
    } catch (error) {
      toastError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!syncUrl) return;

    const next = new URLSearchParams(searchParams);
    const values = { width, aspectRatio, rimDiameter, brand: tireBrand };

    for (const [key, value] of Object.entries(values)) {
      if (value && isTireCategoryName(activeCategory)) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    }

    if (partType && activeCategory === "ช่วงล่าง") {
      next.set("partType", partType);
    } else {
      next.delete("partType");
    }

    if (oilSize && activeCategory === OIL_CATEGORY) {
      next.set("oilSize", oilSize);
    } else {
      next.delete("oilSize");
    }

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    syncUrl,
    activeCategory,
    width,
    aspectRatio,
    rimDiameter,
    tireBrand,
    partType,
    oilSize,
  ]);

  useEffect(() => {
    onLoadingChange?.(isLoading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const debouncedFilter = useDebouncedCallback(() => {
    handleFilter(category, search, buildFilterParams());
  }, 500);

  useEffect(() => {
    if (!isTireCategoryName(activeCategory)) {
      setTireBrand("");
      setWidth("");
      setAspectRatio("");
      setRimDiameter("");
    }
    if (activeCategory !== "ช่วงล่าง") setPartType("");
    if (activeCategory !== OIL_CATEGORY) setOilSize("");
    // ส่งตัวกรองยางไปด้วยตั้งแต่ครั้งแรก เผื่อกู้คืนมาจาก URL
    handleFilter(
      category,
      search,
      isTireCategoryName(activeCategory) ? buildFilterParams() : {},
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search, reloadToken]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [partsRes, categoriesRes] = await Promise.all([
          listParts(),
          listCategories(),
        ]);
        partsListCache = partsRes.data || [];
        categoryOrderCache = [...(categoriesRes.data || [])]
          .sort((a, b) => a.id - b.id)
          .map((c) => c.name);
        if (!mounted) return;
        setPartsList(partsListCache);
        setCategoryOrder(categoryOrderCache);
      } catch (error) {
        toastError(error, "โหลดรายการอะไหล่ไม่สำเร็จ");
        setPartsList([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const tireParts = useMemo(
    () => partsList.filter((p) => p?.category?.name === activeCategory),
    [partsList, activeCategory],
  );

  const partTypeOptions = useMemo(() => {
    const types = partsList
      .filter((p) => p?.category?.name === "ช่วงล่าง")
      .map((p) => getPartType(p.name));

    return Array.from(new Set(types)).sort(compareSuspensionTypes);
  }, [partsList]);

  const oilSizeOptions = useMemo(() => oilGroupOptions(partsList), [partsList]);

  // ตัวเลือกของแต่ละช่องกรองด้วย "ช่องอื่นทั้งหมด" ยกเว้นตัวเอง เพื่อให้เลือกช่องไหนก่อนก็ได้
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

  const hasVehicleFilter =
    !!(vehicle?.brand && vehicle?.model) &&
    inventory.some((item) => item.compatibleVehicles?.length > 0);

  // ซ่อนเฉพาะอะไหล่ที่ระบุรุ่นรถไว้และไม่มีรุ่นนี้ ของที่ไม่ได้ระบุ (เช่นน้ำมัน) ใช้ได้ทุกคัน
  const matchesVehicle = (item) => {
    const list = item.compatibleVehicles;
    if (!Array.isArray(list) || list.length === 0) return true;

    return list.some(
      (v) =>
        String(v?.brand || "").trim() === String(vehicle.brand).trim() &&
        String(v?.model || "").trim() === String(vehicle.model).trim(),
    );
  };

  const filteredByVehicle =
    hasVehicleFilter && onlyMatchingVehicle
      ? inventory.filter(matchesVehicle)
      : inventory;

  const filteredByPartType =
    activeCategory === "ช่วงล่าง" && partType
      ? filteredByVehicle.filter((item) => getPartType(item.name) === partType)
      : filteredByVehicle;

  const filteredByOilSize =
    activeCategory === OIL_CATEGORY && oilSize
      ? filteredByPartType.filter((item) => oilGroupOf(item) === oilSize)
      : filteredByPartType;

  const visibleInventory = sortForCategory(activeCategory, filteredByOilSize);
  const inventoryGroups = useMemo(
    () => groupInventory(activeCategory, visibleInventory, categoryOrder),
    [visibleInventory, activeCategory, categoryOrder],
  );

  const hasTireFilter = !!(
    width ||
    aspectRatio ||
    rimDiameter ||
    (!isUsedTireCategory && tireBrand)
  );

  // เลือกค่าไว้แล้วต้องเปิดไว้เสมอ ไม่งั้นแก้หรือล้างค่านั้นไม่ได้
  const isFilterLocked = (options, value) => options.length === 0 && !value;

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

  const getEmptyMessage = () => {
    if (hasVehicleFilter && onlyMatchingVehicle) {
      return `ไม่พบอะไหล่ที่ใส่กับ ${vehicle.brand} ${vehicle.model} ได้`;
    }
    if (search) {
      const term = search.length > 20 ? `${search.slice(0, 20)}…` : search;
      return `ไม่พบ "${term}"`;
    }
    if (hasTireFilter) return "ไม่พบยางตามเงื่อนไขที่เลือก";
    if (activeCategory !== "ทั้งหมด") return "ไม่มีรายการในหมวดนี้";
    return "ไม่มีอะไหล่และบริการ";
  };

  const renderItem = (item) => {
    const { disabled, ...cardProps } = getCardProps(item);
    return (
      <div
        key={`${item.category?.name}-${item.id}`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        onKeyDown={onKeyActivate(() => !disabled && onItemClick?.(item))}
        onClick={() => !disabled && onItemClick?.(item)}
        className={`mt-4 rounded-lg ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        }`}
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
          category={item.category?.name}
          soldPriceRange={item.soldPriceRange}
          oilSource={item.oilSource}
          {...cardProps}
        />
      </div>
    );
  };

  const tireFilterField = (label, options, value, setValue, placeholder) => (
    <div className="min-w-0 flex-1">
      <ComboBox
        label={label}
        options={options.map((o) => ({ name: o }))}
        value={value}
        onChange={(v) => {
          setValue(v);
          debouncedFilter();
        }}
        placeholder={placeholder}
        disabled={isFilterLocked(options, value)}
        customClass="text-lg md:text-xl"
        labelClass="text-xl md:text-[22px]"
      />
    </div>
  );

  const separator = (text) => (
    <span className="text-subtle-dark flex h-[41px] shrink-0 items-center text-xl font-medium md:text-[22px]">
      {text}
    </span>
  );

  return (
    <div className="flex flex-1 flex-col">
      <SearchBar
        placeholder="ค้นหารหัส, ชื่อ, ยี่ห้อ"
        {...(syncUrl
          ? {}
          : {
              value: localSearch,
              onSearch: setLocalSearch,
              inputMode: "none",
            })}
      />

      <CategoryList
        activeCategory={activeCategory}
        setActiveCategory={setLocalCategory}
        syncUrl={syncUrl}
      />

      {hasVehicleFilter && (
        <button
          type="button"
          onClick={() => setOnlyMatchingVehicle((v) => !v)}
          aria-pressed={onlyMatchingVehicle}
          className="mt-4 flex cursor-pointer items-center gap-2 self-start"
        >
          <span
            className={`flex h-5.5 w-9.5 shrink-0 items-center rounded-full p-[3px] duration-300 ${
              onlyMatchingVehicle ? "bg-primary" : "bg-gray-300"
            }`}
          >
            <span
              className={`bg-surface h-4 w-4 rounded-full duration-300 ${
                onlyMatchingVehicle ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </span>
          <span
            className={`truncate text-base font-medium md:text-lg ${
              onlyMatchingVehicle ? "text-primary" : "text-subtle-dark"
            }`}
          >
            เฉพาะ {vehicle.brand} {vehicle.model}
          </span>
        </button>
      )}

      {isTireCategoryName(activeCategory) && (
        <div
          className={`mt-4 flex w-full flex-col ${isUsedTireCategory ? "" : "gap-3"}`}
        >
          <div>
            {/* แถวนี้สูงเท่าเดิมตลอด (หัวข้อล่องหนค้ำไว้) ไม่งั้นช่องขนาดจะขยับหนีนิ้วตอนปุ่มล้างโผล่ */}
            <div className="mb-2 flex items-center justify-between">
              <span
                aria-hidden={isUsedTireCategory}
                className={`text-xl font-medium md:text-[22px] ${
                  isUsedTireCategory ? "invisible" : ""
                }`}
              >
                ยี่ห้อ
              </span>
              {hasTireFilter && (
                <button
                  type="button"
                  onClick={handleResetTireFilter}
                  className="text-destructive flex cursor-pointer items-center gap-1 text-lg font-semibold md:text-xl"
                >
                  <X className="h-4 w-4" />
                  ล้างตัวกรอง
                </button>
              )}
            </div>
            {!isUsedTireCategory && (
              <ComboBox
                options={availableTireBrands.map((b) => ({ name: b }))}
                value={tireBrand}
                onChange={(v) => {
                  setTireBrand(v);
                  debouncedFilter();
                }}
                placeholder="-- เลือกยี่ห้อ --"
                disabled={isFilterLocked(availableTireBrands, tireBrand)}
                customClass="text-lg md:text-xl"
              />
            )}
          </div>

          <div className="flex items-end gap-2">
            {tireFilterField("หน้ายาง", widthOptions, width, setWidth, "มม.")}
            {separator("/")}
            {tireFilterField(
              "แก้มยาง",
              aspectRatioOptions,
              aspectRatio,
              setAspectRatio,
              "%",
            )}
            {separator("R")}
            {tireFilterField(
              "ขอบ",
              rimDiameterOptions,
              rimDiameter,
              setRimDiameter,
              "นิ้ว",
            )}
          </div>
        </div>
      )}

      {activeCategory === "ช่วงล่าง" && (
        <div className="mt-4 w-full">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xl font-medium md:text-[22px]">ประเภท</span>
            {partType && (
              <button
                type="button"
                onClick={() => setPartType("")}
                className="text-destructive flex cursor-pointer items-center gap-1 text-lg font-semibold md:text-xl"
              >
                <X className="h-4 w-4" />
                ล้างตัวกรอง
              </button>
            )}
          </div>
          <ComboBox
            options={partTypeOptions.map((t) => ({ name: t }))}
            value={partType}
            onChange={setPartType}
            placeholder="-- เลือกประเภท --"
            disabled={isFilterLocked(partTypeOptions, partType)}
            customClass="text-lg md:text-xl"
          />
        </div>
      )}

      {activeCategory === OIL_CATEGORY && oilSizeOptions.length > 0 && (
        <div className="mt-4 w-full">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xl font-medium md:text-[22px]">ประเภท</span>
            {oilSize && (
              <button
                type="button"
                onClick={() => setOilSize("")}
                className="text-destructive flex cursor-pointer items-center gap-1 text-lg font-semibold md:text-xl"
              >
                <X className="h-4 w-4" />
                ล้างตัวกรอง
              </button>
            )}
          </div>
          <ComboBox
            options={oilSizeOptions.map((size) => ({ name: size }))}
            value={oilSize}
            onChange={setOilSize}
            placeholder="-- เลือกประเภท --"
            customClass="text-lg md:text-xl"
          />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate text-xl font-semibold md:text-[22px]">
            {activeCategory === "ทั้งหมด"
              ? "รายการอะไหล่และบริการ"
              : activeCategory}
          </p>
          {!isLoading && visibleInventory.length > 0 && (
            <span className="text-subtle-light shrink-0 text-lg font-medium md:text-xl">
              ({visibleInventory.length})
            </span>
          )}
        </div>
        {headerAction}
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : visibleInventory.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-subtle-light px-5 text-center text-xl text-balance md:text-[22px]">
            {getEmptyMessage()}
          </p>
        </div>
      ) : inventoryGroups ? (
        inventoryGroups.map((group) => (
          <div key={group.name}>
            {group.name !== NO_CATEGORY_GROUP && (
              <div className="mt-4 flex items-center gap-2">
                <p className="text-subtle-dark text-lg font-semibold md:text-xl">
                  {group.name}
                </p>
                <span className="text-subtle-light text-lg md:text-xl">
                  ({group.items.length})
                </span>
                <div className="bg-subtle-light/40 h-px flex-1" />
              </div>
            )}
            {group.items.map(renderItem)}
          </div>
        ))
      ) : (
        visibleInventory.map(renderItem)
      )}
    </div>
  );
};
export default InventoryBrowser;
