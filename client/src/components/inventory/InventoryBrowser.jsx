import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useDebouncedCallback } from "use-debounce";
import { LoaderCircle, X } from "lucide-react";
import InventoryCard from "@/components/cards/InventoryCard";
import SearchBar from "@/components/forms/SearchBar";
import CategoryList from "@/components/CategoryList";
import ComboBox from "@/components/ui/ComboBox";
import { listInventory } from "@/api/inventory";
import { listParts } from "@/api/part";
import { listCategories } from "@/api/category";
import { toastError } from "@/utils/handleError";
import { onKeyActivate } from "@/utils/a11y";
import { sortServices } from "@/constants/services";
import { getPartType } from "@/utils/suspension";
import { isTireCategoryName } from "@/constants/categories";

// เรียงชื่อชนิดอะไหล่ตามตัวอักษรไทย
const thaiCollator = new Intl.Collator("th");

// หน้าคลังกับไดอะล็อกเลือกอะไหล่ลงบิลคือหน้าจอเดียวกัน ต่างแค่ "กดการ์ดแล้วเกิดอะไร"
// จึงรวมค้นหา/หมวดหมู่/ตัวกรองยาง/การจัดกลุ่ม/ข้อความว่างไว้ที่นี่ที่เดียว
//
// syncUrl   = เก็บหมวดหมู่กับคำค้นไว้ใน URL (หน้าคลังใช้ ไดอะล็อกไม่ใช้ ไม่งั้นจะไปเปลี่ยน URL ของหน้าที่เปิดค้างอยู่)
// reloadToken = เปลี่ยนค่าเมื่อไหร่ก็โหลดรายการใหม่ (เช่น เพิ่มสต็อกเสร็จ หรือเปิดไดอะล็อก)
// getCardProps = props เพิ่มเติมของการ์ดแต่ละใบ เช่น จำนวนที่เบิกได้ หรือปิดการกดเมื่อของหมด
const InventoryBrowser = ({
  syncUrl = false,
  headerAction = null,
  onItemClick,
  getCardProps = () => ({}),
  reloadToken,
  // { brand, model } ของรถในบิล — มีค่าเมื่อไหร่จะมีสวิตช์ให้กรองเฉพาะอะไหล่ที่ใส่รถคันนั้นได้
  vehicle = null,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [localCategory, setLocalCategory] = useState("ทั้งหมด");
  const [localSearch, setLocalSearch] = useState("");

  const [inventory, setInventory] = useState([]);
  const [partsList, setPartsList] = useState([]);
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // หน้าคลังเก็บตัวกรองยางไว้ใน URL ด้วย เพื่อให้กลับมาจากหน้าอื่น (เช่นหน้าแก้ไข) แล้วยังกรองค้างอยู่
  const initialTireFilter = (key) =>
    syncUrl ? searchParams.get(key) || "" : "";

  // เปิดไว้ก่อนเมื่อรู้รุ่นรถ เพราะส่วนใหญ่ต้องการของที่ใส่ได้จริง แต่ปิดได้ตลอด
  // (อะไหล่บางตัวใส่ข้ามรุ่นได้ แต่ยังไม่ได้บันทึกรุ่นนั้นไว้)
  const [onlyMatchingVehicle, setOnlyMatchingVehicle] = useState(true);

  const [tireBrand, setTireBrand] = useState(() => initialTireFilter("brand"));
  const [width, setWidth] = useState(() => initialTireFilter("width"));
  const [aspectRatio, setAspectRatio] = useState(() =>
    initialTireFilter("aspectRatio"),
  );
  const [rimDiameter, setRimDiameter] = useState(() =>
    initialTireFilter("rimDiameter"),
  );
  // ช่วงล่างมีอะไหล่เป็นร้อยชิ้นแต่แบ่งเป็นชนิดไม่กี่แบบ กรองด้วยชนิดก่อนแล้วค่อยไล่หารุ่นรถ
  const [partType, setPartType] = useState(() => initialTireFilter("partType"));

  const activeCategory = syncUrl
    ? searchParams.get("category") || "ทั้งหมด"
    : localCategory;
  const search = syncUrl ? searchParams.get("search") : localSearch || null;
  const category = activeCategory === "ทั้งหมด" ? null : activeCategory;

  const buildFilterParams = (override = {}) =>
    isTireCategoryName(activeCategory)
      ? { width, aspectRatio, rimDiameter, brand: tireBrand, ...override }
      : {};

  const handleFilter = async (categoryName, searchTerm, filterParams = {}) => {
    setIsLoading(true);
    try {
      const res = await listInventory(categoryName, searchTerm, filterParams);
      setInventory(res.data || []);
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
  ]);

  const debouncedFilter = useDebouncedCallback(() => {
    handleFilter(category, search, buildFilterParams());
  }, 500);

  // โหลดใหม่เมื่อเปลี่ยนหมวด/คำค้น หรือถูกสั่งให้รีเฟรช — ตัวกรองยางมีเส้นทางของตัวเอง (debounce)
  useEffect(() => {
    if (!isTireCategoryName(activeCategory)) {
      setTireBrand("");
      setWidth("");
      setAspectRatio("");
      setRimDiameter("");
    }
    if (activeCategory !== "ช่วงล่าง") setPartType("");
    // ส่งตัวกรองยางไปด้วยตั้งแต่โหลดครั้งแรก เผื่อกู้คืนมาจาก URL — ไม่งั้นจะเห็นยางทั้งหมดจนกว่าจะแตะตัวกรอง
    handleFilter(
      category,
      search,
      isTireCategoryName(activeCategory) ? buildFilterParams() : {},
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search, reloadToken]);

  // รายการอะไหล่ทั้งหมดใช้สร้างตัวเลือกของตัวกรองยาง ส่วนลำดับหมวดหมู่ใช้เรียงกลุ่มให้ตรงกับแถบด้านบน
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

  // ขนาดยางมีสองระบบปนกัน: ตัวเลขเต็ม (195, 205) ที่ใช้กับรถทั่วไป
  // กับทศนิยม (6.50, 7.00) ที่เป็นระบบนิ้วของรถบรรทุก/รถโบราณ ซึ่งเจอไม่บ่อย
  // เรียงตัวเลขเต็มขึ้นก่อนทั้งหมด แล้วดันทศนิยมไว้ท้ายสุด จะได้ไม่แทรกกลางลิสต์ที่ใช้ประจำ
  const isDecimalSize = (value) => /^\d+\.\d+$/.test(value);

  const uniqSorted = (arr = []) =>
    Array.from(new Set(arr)).sort((a, b) => {
      const decimalDiff = isDecimalSize(a) - isDecimalSize(b);
      if (decimalDiff !== 0) return decimalDiff;

      return a.localeCompare(b, undefined, { numeric: true });
    });

  const tireParts = useMemo(
    // ตัวเลือกของตัวกรองมาจากยางในหมวดที่กำลังดูอยู่ ยางใหม่กับยางเปอร์เซ็นต์จึงไม่ปนกัน
    () => partsList.filter((p) => p?.category?.name === activeCategory),
    [partsList, activeCategory],
  );

  // ชนิดอะไหล่ช่วงล่างที่มีอยู่จริงในคลัง เรียงตามตัวอักษรไทย
  const partTypeOptions = useMemo(() => {
    const types = partsList
      .filter((p) => p?.category?.name === "ช่วงล่าง")
      .map((p) => getPartType(p.name));

    return Array.from(new Set(types)).sort((a, b) =>
      thaiCollator.compare(a, b),
    );
  }, [partsList]);

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

  // ซ่อนสวิตช์เมื่อของที่แสดงอยู่ไม่มีตัวไหนผูกกับรุ่นรถเลย (เช่นหมวดยาง)
  // กดแล้วรายการเท่าเดิมจะชวนให้คิดว่าระบบเสีย
  const hasVehicleFilter =
    !!(vehicle?.brand && vehicle?.model) &&
    inventory.some((item) => item.compatibleVehicles?.length > 0);

  // ซ่อนเฉพาะอะไหล่ที่ "ระบุรุ่นรถไว้แล้วและไม่มีรุ่นนี้" — ของที่ยังไม่ได้ระบุจะไม่ถูกซ่อน
  // ไม่งั้นอะไหล่ที่ยังไม่ได้กรอกข้อมูลรถ (เช่น น้ำมันเครื่อง) จะหายไปทั้งที่ใช้ได้กับทุกคัน
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

  // ชนิดอะไหล่ไม่ได้เก็บเป็นฟิลด์ จึงกรองฝั่งหน้าเว็บจากชื่อ ไม่ได้ส่งไปให้เซิร์ฟเวอร์กรอง
  const filteredByPartType =
    activeCategory === "ช่วงล่าง" && partType
      ? filteredByVehicle.filter((item) => getPartType(item.name) === partType)
      : filteredByVehicle;

  const visibleInventory =
    activeCategory === "บริการ"
      ? sortServices(filteredByPartType)
      : filteredByPartType;

  // หมวด "ทั้งหมด" แยกหัวข้อตามหมวดหมู่ เรียงกลุ่มให้ตรงกับแถบหมวดหมู่ด้านบน
  const inventoryGroups = useMemo(() => {
    if (activeCategory !== "ทั้งหมด") return null;

    const groups = new Map();
    for (const item of visibleInventory) {
      const name = item.category?.name || "อื่นๆ";
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(item);
    }

    const rank = (name) => {
      const i = categoryOrder.indexOf(name);
      return i === -1 ? categoryOrder.length : i;
    };

    return [...groups.entries()]
      .map(([name, items]) => ({
        name,
        // บริการเรียงตามลำดับที่ร้านหยิบใช้บ่อย ไม่ใช่ตามที่เซิร์ฟเวอร์ส่งมา
        items: name === "บริการ" ? sortServices(items) : items,
      }))
      .sort((a, b) => rank(a.name) - rank(b.name));
  }, [visibleInventory, activeCategory, categoryOrder]);

  const hasTireFilter = !!(width || aspectRatio || rimDiameter || tireBrand);

  // ไม่มีตัวเลือกให้เลือก = ปิดช่องไว้ (เช่น 195R14 ไม่มีแก้มยาง) แต่ถ้าเลือกค่าไว้แล้ว
  // ต้องเปิดไว้เสมอ ไม่งั้นผู้ใช้จะแก้หรือล้างค่านั้นไม่ได้
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

  // บอกให้ตรงกับสิ่งที่ผู้ใช้กำลังหาอยู่ ไม่งั้นจะเข้าใจผิดว่าคลังว่างทั้งที่แค่คำค้น/ตัวกรองไม่ตรง
  const getEmptyMessage = () => {
    if (hasVehicleFilter && onlyMatchingVehicle) {
      return `ไม่พบอะไหล่ที่ใส่กับ ${vehicle.brand} ${vehicle.model} ได้`;
    }
    if (search) {
      // ตัดกันตกบรรทัด — คำค้นอาจยาวเกินได้ถ้าใส่มาทาง URL ตรงๆ
      const term = search.length > 20 ? `${search.slice(0, 20)}…` : search;
      return `ไม่พบ "${term}"`;
    }
    // ตัวเลือกยางไล่กรองกันเอง เลือกจากดรอปดาวน์ยังไงก็เจอเสมอ — เหลือไว้เผื่อเปิดจาก URL ที่ระบุค่ามาเอง
    if (hasTireFilter) return "ไม่พบยางตามเงื่อนไขที่เลือก";
    // ไม่เอาชื่อหมวดมาต่อ: หัวข้อด้านบนบอกอยู่แล้ว และหมวดชื่อยาวจะทำให้ข้อความตกบรรทัด
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
        className={`mt-[16px] rounded-[10px] ${
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
          className="mt-[16px] flex cursor-pointer items-center gap-[8px] self-start"
        >
          <span
            className={`flex h-[22px] w-[38px] shrink-0 items-center rounded-full p-[3px] duration-300 ${
              onlyMatchingVehicle ? "bg-primary" : "bg-gray-300"
            }`}
          >
            <span
              className={`bg-surface h-[16px] w-[16px] rounded-full duration-300 ${
                onlyMatchingVehicle ? "translate-x-[16px]" : "translate-x-0"
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
        <div className="mt-[16px] flex w-full flex-col gap-[12px]">
          <div>
            <div className="mb-[8px] flex items-center justify-between">
              <span className="text-xl font-medium md:text-[22px]">ยี่ห้อ</span>
              {hasTireFilter && (
                <button
                  type="button"
                  onClick={handleResetTireFilter}
                  className="text-destructive flex cursor-pointer items-center gap-[4px] text-lg font-semibold md:text-xl"
                >
                  <X className="h-4 w-4" />
                  ล้างตัวกรอง
                </button>
              )}
            </div>
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
          </div>

          <div className="flex items-end gap-[8px]">
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
        <div className="mt-[16px] w-full">
          <div className="mb-[8px] flex items-center justify-between">
            <span className="text-xl font-medium md:text-[22px]">
              ประเภทอะไหล่
            </span>
            {partType && (
              <button
                type="button"
                onClick={() => setPartType("")}
                className="text-destructive flex cursor-pointer items-center gap-[4px] text-lg font-semibold md:text-xl"
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
            placeholder="-- เลือกประเภทอะไหล่ --"
            disabled={isFilterLocked(partTypeOptions, partType)}
            customClass="text-lg md:text-xl"
          />
        </div>
      )}

      <div className="mt-[16px] flex items-center justify-between gap-[8px]">
        {/* min-w-0 + truncate: จอแคบให้หัวข้อย่อด้วย ... ไม่ใช่ไปดันปุ่มขวาให้ตกบรรทัด */}
        <div className="flex min-w-0 items-center gap-[6px]">
          <p className="truncate text-xl font-semibold md:text-[22px]">
            {activeCategory === "ทั้งหมด"
              ? "รายการอะไหล่และบริการ"
              : activeCategory}
          </p>
          {!isLoading && (
            <span className="text-subtle-light shrink-0 font-medium">
              ({visibleInventory.length})
            </span>
          )}
        </div>
        {headerAction}
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
        </div>
      ) : visibleInventory.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-subtle-light px-[20px] text-center text-xl text-balance md:text-[22px]">
            {getEmptyMessage()}
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
        visibleInventory.map(renderItem)
      )}
    </div>
  );
};
export default InventoryBrowser;
