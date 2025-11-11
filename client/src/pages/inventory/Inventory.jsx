import { useSearchParams, Link } from "react-router";
import { useEffect, useState, useRef, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import InventoryCard from "@/components/cards/InventoryCard";
import SearchBar from "@/components/forms/SearchBar";
import CategoryList from "@/components/CategoryList";
import ItemDetailDialog from "@/components/dialogs/ItemDetailDialog";
import { getInventory } from "@/api/inventory";
import { getParts } from "@/api/part";
import { LoaderCircle } from "lucide-react";
import { BoxSearch } from "@/components/icons/Icons";

import ComboBox from "@/components/ui/ComboBox";

const Inventory = () => {
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [inventory, setInventory] = useState([]);
  const [tireBrand, setTireBrand] = useState("");
  const [width, setWidth] = useState("");
  const [aspectRatio, setAspectRatio] = useState("");
  const [rimDiameter, setRimDiameter] = useState("");
  const [partsList, setPartsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemDetail, setShowItemDetail] = useState(false);
  const isInitializing = useRef(false);

  const category = searchParams.get("category");
  const search = searchParams.get("search");

  // สร้างพารามิเตอร์การกรองตามหมวดหมู่และตัวเลือกที่เลือก
  const buildFilterParams = () =>
    activeCategory === "ยาง"
      ? { width, aspectRatio, rimDiameter, brand: tireBrand }
      : {};

  // Debounced การกรองข้อมูลเพื่อป้องกันการเรียก API บ่อยเกินไป
  const debouncedFilter = useDebouncedCallback(() => {
    const params = buildFilterParams();
    handleFilter(category, search, params);
  }, 300);

  const uniqSorted = (arr = []) =>
    Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));

  const isTirePart = (p) => p?.category?.name === "ยาง";

  const widthOptions = useMemo(() => {
    return uniqSorted(
      partsList
        .filter(isTirePart)
        .map((p) => (p.typeSpecificData?.width ?? "").toString().trim())
        .filter((v) => v !== "")
    );
  }, [partsList]);

  const aspectRatioOptions = useMemo(() => {
    return uniqSorted(
      partsList
        .filter(
          (p) =>
            isTirePart(p) &&
            (!width || String(p.typeSpecificData?.width) === String(width))
        )
        .map((p) => (p.typeSpecificData?.aspectRatio ?? "").toString().trim())
        .filter((v) => v !== "")
    );
  }, [partsList, width]);

  const rimDiameterOptions = useMemo(() => {
    return uniqSorted(
      partsList
        .filter(
          (p) =>
            isTirePart(p) &&
            (!width || String(p.typeSpecificData?.width) === String(width)) &&
            (!aspectRatio ||
              String(p.typeSpecificData?.aspectRatio) === String(aspectRatio))
        )
        .map((p) => (p.typeSpecificData?.rimDiameter ?? "").toString().trim())
        .filter((v) => v !== "")
    );
  }, [partsList, width, aspectRatio]);

  const availableTireBrands = useMemo(() => {
    const brands = partsList
      .filter(
        (p) =>
          isTirePart(p) &&
          (!width || String(p.typeSpecificData?.width) === String(width)) &&
          (!aspectRatio ||
            String(p.typeSpecificData?.aspectRatio) === String(aspectRatio)) &&
          (!rimDiameter ||
            String(p.typeSpecificData?.rimDiameter) === String(rimDiameter))
      )
      .map((p) => (p.brand || "").toString().trim())
      .filter((b) => !!b);

    return uniqSorted(brands);
  }, [partsList, width, aspectRatio, rimDiameter]);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (isInitializing.current) return;
    isInitializing.current = true;

    const params = new URLSearchParams();
    setSearchParams(params);
    setActiveCategory("ทั้งหมด");
    handleFilter(null, null);

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
    try {
      const res = await getInventory(category, search, filterParams);
      const data = res.data || [];

      setInventory(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const partsRes = await getParts();
        if (!mounted) return;
        setPartsList(partsRes.data || []);
      } catch (err) {
        console.error("getParts failed", err);
        setPartsList([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleStockUpdate = () => {
    // รีเฟรชข้อมูลหลังจากเพิ่มสต็อก
    const filterParams =
      activeCategory === "ยาง"
        ? { width, aspectRatio, rimDiameter, brand: tireBrand }
        : {};
    handleFilter(category, search, filterParams);
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowItemDetail(true);
  };

  return (
    <div className="w-full h-[87px] bg-gradient-primary shadow-primary">
      <div className="flex items-center gap-[8px] pt-[16px] pl-[20px]">
        <div className="flex items-center justify-center w-[40px] h-[40px] rounded-full bg-surface/20">
          <BoxSearch color="#ffffff" />
        </div>
        <div>
          <p className="font-semibold text-[24px] md:text-[26px] text-surface">
            อะไหล่และบริการ
          </p>
        </div>
      </div>

      <div className="w-full min-h-[calc(100vh-65px)] pb-[112px] xl:pb-[16px] mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <div className="px-[20px] pt-[16px]">
          {/* แถบค้นหา */}
          <SearchBar placeholder="ค้นหารหัส, ยี่ห้อ, ชื่ออะไหล่" />

          {/* แถบหมวดหมู่ */}
          <CategoryList
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />

          {/* ตัวเลือกกรองพิเศษสำหรับหมวดยาง */}
          {activeCategory === "ยาง" && (
            <div className="flex items-center mt-[16px]">
              <div className="flex flex-col w-full gap-[16px]">
                <div className="w-full">
                  <ComboBox
                    label="หน้ายาง (มม.)"
                    options={[...widthOptions.map((p) => ({ name: p }))]}
                    value={width}
                    onChange={(v) => {
                      setWidth(v);
                      debouncedFilter();
                    }}
                    placeholder="-- เลือกหน้ายาง --"
                    customClass="text-[18px] md:text-[20px]"
                    labelClass="text-[20px] md:text-[22px]"
                  />
                </div>

                <div className="w-full">
                  <ComboBox
                    label="แก้มยาง (%)"
                    options={[...aspectRatioOptions.map((p) => ({ name: p }))]}
                    value={aspectRatio}
                    onChange={(v) => {
                      setAspectRatio(v);
                      debouncedFilter();
                    }}
                    placeholder="-- เลือกแก้มยาง --"
                    customClass="text-[18px] md:text-[20px]"
                    labelClass="text-[20px] md:text-[22px]"
                  />
                </div>

                <div className="w-full">
                  <ComboBox
                    label="ขอบ (นิ้ว)"
                    options={[...rimDiameterOptions.map((p) => ({ name: p }))]}
                    value={rimDiameter}
                    onChange={(v) => {
                      setRimDiameter(v);
                      debouncedFilter();
                    }}
                    placeholder="-- เลือกขอบ --"
                    customClass="text-[18px] md:text-[20px]"
                    labelClass="text-[20px] md:text-[22px]"
                  />
                </div>

                <div className="w-full">
                  <ComboBox
                    label="ยี่ห้อ"
                    options={[...availableTireBrands.map((b) => ({ name: b }))]}
                    value={tireBrand}
                    onChange={(v) => {
                      setTireBrand(v);
                      debouncedFilter();
                    }}
                    placeholder="-- เลือกยี่ห้อ --"
                    customClass="text-[18px] md:text-[20px]"
                    labelClass="text-[20px] md:text-[22px]"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-[16px]">
            <p className="font-semibold text-[20px] md:text-[22px]">
              รายการอะไหล่และบริการ
            </p>
            <Link
              to="/inventory/new"
              className="font-semibold text-[20px] md:text-[22px] text-primary cursor-pointer"
            >
              + เพิ่มรายการ
            </Link>
          </div>

          {/* รายการอะไหล่และบริการ */}
          {isLoading ? (
            <div className="flex justify-center items-center h-[346px]">
              <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : inventory.length === 0 ? (
            <div className="flex justify-center items-center h-[346px]">
              <p className="font-medium text-[20px] md:text-[22px] text-subtle-light">
                ไม่พบอะไหล่และบริการ
              </p>
            </div>
          ) : (
            inventory.map((item) => (
              <div
                key={`${item.category.name}-${item.id}`}
                onClick={() => handleItemClick(item)}
              >
                <InventoryCard
                  item={item}
                  brand={item.brand}
                  name={item.name}
                  unit={item.unit}
                  sellingPrice={item.sellingPrice}
                  stockQuantity={item.stockQuantity}
                  minStockLevel={item.minStockLevel}
                  typeSpecificData={item.typeSpecificData}
                  secureUrl={item.secureUrl}
                  category={item.category.name}
                  onStockUpdate={handleStockUpdate}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal แสดงรายละเอียดสินค้า */}
      <ItemDetailDialog
        item={selectedItem}
        open={showItemDetail}
        onOpenChange={setShowItemDetail}
        onStockUpdate={handleStockUpdate}
      />
    </div>
  );
};
export default Inventory;
