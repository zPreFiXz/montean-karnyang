import { getCategories } from "@/api/category";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { ToolBox, Tire, Shock, Oil } from "@/components/icons/Icon";
import { LoaderCircle } from "lucide-react";

const iconMap = {
  บริการ: ToolBox,
  ยาง: Tire,
  ยางใน: Shock,
  น้ำมันเครื่อง: Oil,
};

const CategoryList = ({ activeCategory, setActiveCategory }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleFilter = (category) => {
    const params = new URLSearchParams(searchParams);
    params.set("category", category);
    setSearchParams(params);
  };

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await getCategories();
      const categoriesWithIcons = res.data
        .map((category) => ({
          ...category,
          icon: iconMap[category.name] || ToolBox,
        }))
        .sort((a, b) => a.id - b.id);
      setCategories(categoriesWithIcons);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="overflow-x-auto scrollbar-hide px-[20px] -mx-[20px] mt-[16px]">
      {isLoading ? (
        <div className="flex justify-center items-center h-[80px]">
          <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex gap-[8px]">
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams);
            params.delete("category");
            setActiveCategory("ทั้งหมด");
            setSearchParams(params);
          }}
          className={`flex flex-col justify-center items-center w-[80px] h-[80px] px-[20px] py-[12px] rounded-[10px] border duration-200 ${
            activeCategory === "ทั้งหมด"
              ? "border-transparent text-surface bg-gradient-primary"
              : "border-subtle-light text-subtle-dark bg-surface"
          }`}
        >
          <div className="font-semibold text-[14px] md:text-[16px] text-nowrap">ทั้งหมด</div>
        </button>

        {/* แถบหมวดหมู่ */}
        {categories.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeCategory === item.name;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveCategory(item.name);
                handleFilter(item.name);
              }}
              className={`flex flex-col justify-center items-center w-[80px] h-[80px] px-[20px] py-[12px] border rounded-[10px] duration-200 ${
                isActive
                  ? "border-transparent text-surface bg-gradient-primary"
                  : "border-subtle-light text-subtle-dark bg-surface"
              }`}
            >
              <div
                className={`flex items-center justify-center w-[45px] h-[45px] ${
                  isActive ? "text-surface" : "text-subtle-dark"
                }`}
              >
                <IconComponent />
              </div>
              <div className="font-semibold text-[14px] md:text-[16px] text-nowrap">
                {item.name}
              </div>
            </button>
          );
        })}
        </div>
      )}
    </div>
  );
};
export default CategoryList;
