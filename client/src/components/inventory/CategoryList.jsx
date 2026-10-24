import { listCategories } from "@/api/category";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { ICON_MAP, DEFAULT_ICON } from "@/components/icons/categoryIcons";
import { LoaderCircle } from "lucide-react";
import { toastError } from "@/utils/handleError";

// จำไว้ข้ามการเปลี่ยนหน้า แต่ยังดึงใหม่ทุกครั้ง เผื่อเพิ่งเพิ่มหรือเรียงหมวดใหม่
let categoryCache = null;

// syncUrl=false สำหรับที่ที่ไม่ควรแตะ URL เช่นไดอะล็อกที่เปิดทับหน้าอื่นอยู่
const CategoryList = ({
  activeCategory,
  setActiveCategory,
  syncUrl = true,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState(categoryCache || []);
  const [isLoading, setIsLoading] = useState(!categoryCache);
  const stripRef = useRef(null);
  const activeRef = useRef(null);

  // เปิดหน้ามาใหม่ = จัดหมวดที่เลือกมากลางจอ กดเลือกเอง = เลื่อนแค่พอให้เห็นเต็มใบ
  // ถ้าลากมากลางทุกครั้งปุ่มข้างเคียงจะสลับที่
  const hasCentered = useRef(false);
  useLayoutEffect(() => {
    const strip = stripRef.current;
    const chip = activeRef.current;
    if (isLoading || !strip || !chip) return;

    if (!hasCentered.current) {
      hasCentered.current = true;
      const center =
        chip.offsetLeft - (strip.clientWidth - chip.clientWidth) / 2;
      strip.scrollLeft = Math.max(0, center);
      return;
    }

    const margin = 20;
    const left = chip.offsetLeft - margin;
    const right = chip.offsetLeft + chip.clientWidth + margin;
    if (left < strip.scrollLeft) {
      strip.scrollTo({ left, behavior: "smooth" });
    } else if (right > strip.scrollLeft + strip.clientWidth) {
      strip.scrollTo({ left: right - strip.clientWidth, behavior: "smooth" });
    }
  }, [isLoading, activeCategory]);

  useEffect(() => {
    fetchCategory();
  }, []);

  const handleFilter = (category) => {
    if (!syncUrl) return;
    const params = new URLSearchParams(searchParams);
    params.set("category", category);
    setSearchParams(params);
  };

  const fetchCategory = async () => {
    try {
      const res = await listCategories();
      const categoryWithIcons = res.data
        .map((item) => ({
          ...item,
          icon: ICON_MAP[item.name] || DEFAULT_ICON,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
      categoryCache = categoryWithIcons;
      setCategory(categoryWithIcons);
    } catch (error) {
      toastError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={stripRef}
      className="scrollbar-hide -mx-5 mt-4 overflow-x-auto overflow-y-hidden pl-5"
    >
      {isLoading ? (
        // แถบถูกดึงขอบออกข้างละ 20 แล้วคืนระยะเฉพาะด้านซ้าย ตอนโหลดจึงต้องใส่ด้านขวาด้วย
        <div className="flex h-20 items-center justify-center pr-5">
          <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveCategory("ทั้งหมด");
              if (!syncUrl) return;
              const params = new URLSearchParams(searchParams);
              params.delete("category");
              setSearchParams(params);
            }}
            className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border px-5 py-3 duration-300 ${
              activeCategory === "ทั้งหมด"
                ? "text-surface bg-gradient-primary border-transparent"
                : "text-subtle-dark bg-surface border-slate-500"
            }`}
          >
            <div className="text-sm font-semibold text-nowrap md:text-base">
              ทั้งหมด
            </div>
          </button>

          {category.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeCategory === item.name;
            return (
              <button
                key={item.id}
                ref={isActive ? activeRef : null}
                onClick={() => {
                  setActiveCategory(item.name);
                  handleFilter(item.name);
                }}
                className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border px-5 py-3 duration-300 ${
                  isActive
                    ? "text-surface bg-gradient-primary border-transparent"
                    : "bg-surface text-subtle-dark border-slate-500"
                }`}
              >
                <div
                  className={`flex h-[45px] w-[45px] items-center justify-center ${
                    isActive ? "text-surface" : "text-subtle-dark"
                  }`}
                >
                  <IconComponent />
                </div>
                <div className="text-sm font-semibold text-nowrap md:text-base">
                  {item.name}
                </div>
              </button>
            );
          })}
          <div className="w-3 flex-shrink-0"></div>
        </div>
      )}
    </div>
  );
};
export default CategoryList;
