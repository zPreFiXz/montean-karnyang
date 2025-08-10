import { getCategories } from "@/api/category";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { ToolBox, Tire, Shock, Oil } from "@/components/icons/Icon";

const iconMap = {
  บริการ: ToolBox,
  ยาง: Tire,
  ยางใน: Shock,
  น้ำมันเครื่อง: Oil,
};

const CategoryList = ({ activeCategory, setActiveCategory }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);

  const handleFilter = (category) => {
    const params = new URLSearchParams(searchParams);
    params.set("category", category);
    setSearchParams(params);
  };

  const fetchCategories = async () => {
    try {
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
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-[20px] px-[20px] mt-[16px]">
      <div className="flex gap-[8px]">
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams);
            params.delete("category");
            setActiveCategory("ทั้งหมด");
            setSearchParams(params);
          }}
          className={`flex flex-col items-center justify-center w-[80px] h-[80px] px-[20px] py-[12px] border rounded-[10px] transition-all duration-200 ${
            activeCategory === "ทั้งหมด"
              ? "border-transparent text-surface bg-gradient-primary"
              : "border-subtle-light text-subtle-dark bg-surface"
          }`}
        >
          <div className="font-semibold text-[14px] text-nowrap">ทั้งหมด</div>
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
              className={`flex flex-col items-center justify-center w-[80px] h-[80px] px-[20px] py-[12px] border rounded-[10px] transition-all duration-200 ${
                isActive
                  ? "border-transparent text-surface bg-gradient-primary"
                  : "border-subtle-light text-subtle-dark bg-surface"
              }`}
            >
              <div
                className={`w-[45px] h-[45px] flex items-center justify-center ${
                  isActive ? "text-surface" : "text-subtle-dark"
                }`}
              >
                <IconComponent />
              </div>
              <div className="font-semibold text-[14px] text-nowrap">
                {item.name}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default CategoryList;
