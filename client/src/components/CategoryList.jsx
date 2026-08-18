import { listCategories } from "@/api/category";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { ICON_MAP, DEFAULT_ICON } from "@/components/icons/categoryIcons";
import { LoaderCircle } from "lucide-react";
import { toastError } from "@/utils/handleError";

// syncUrl=false สำหรับที่ที่ไม่ควรแตะ URL เช่นไดอะล็อกที่เปิดทับหน้าอื่นอยู่
const CategoryList = ({
  activeCategory,
  setActiveCategory,
  syncUrl = true,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(true);
      const res = await listCategories();
      const categoryWithIcons = res.data
        .map((item) => ({
          ...item,
          icon: ICON_MAP[item.name] || DEFAULT_ICON,
        }))
        .sort((a, b) => a.id - b.id);
      setCategory(categoryWithIcons);
    } catch (error) {
      toastError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="scrollbar-hide -mx-[20px] mt-[16px] overflow-x-auto overflow-y-hidden pl-[20px]">
      {isLoading ? (
        <div className="flex h-[80px] items-center justify-center">
          <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="flex gap-[8px]">
          {/* หมวดหมู่ทั้งหมด */}
          <button
            onClick={() => {
              setActiveCategory("ทั้งหมด");
              if (!syncUrl) return;
              const params = new URLSearchParams(searchParams);
              params.delete("category");
              setSearchParams(params);
            }}
            className={`flex h-[80px] w-[80px] cursor-pointer flex-col items-center justify-center rounded-[10px] border px-[20px] py-[12px] duration-300 ${
              activeCategory === "ทั้งหมด"
                ? "text-surface bg-gradient-primary border-transparent"
                : "text-subtle-dark bg-surface border-slate-500"
            }`}
          >
            <div className="text-sm font-semibold text-nowrap md:text-base">
              ทั้งหมด
            </div>
          </button>

          {/* หมวดหมู่อะไหล่และบริการ */}
          {category.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeCategory === item.name;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveCategory(item.name);
                  handleFilter(item.name);
                }}
                className={`flex h-[80px] w-[80px] cursor-pointer flex-col items-center justify-center rounded-[10px] border px-[20px] py-[12px] duration-300 ${
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
          <div className="w-[12px] flex-shrink-0"></div>
        </div>
      )}
    </div>
  );
};
export default CategoryList;
