import { getCategories } from "@/api/category";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import {
  ToolBox,
  Tire,
  Innertube,
  Oil,
  Filter,
  Battery,
  Brake,
  Shock,
  Belt,
  Gear,
  Light,
  Wiper,
  Suspension,
} from "@/components/icons/Icons";
import { LoaderCircle } from "lucide-react";

const ICON_MAP = {
  บริการ: ToolBox,
  ช่วงล่าง: Suspension,
  ยาง: Tire,
  ยางใน: Innertube,
  น้ำมันเครื่อง: Oil,
  เบรค: Brake,
  โช๊คอัพ: Shock,
  "คลัช-เกียร์": Gear,
  แบตเตอรี่: Battery,
  ระบบไฟฟ้า: Light,
  สายพาน: Belt,
  ใบปัดน้ำฝน: Wiper,
  ไส้กรอง: Filter,
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
          icon: ICON_MAP[category.name] || ToolBox,
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
              const params = new URLSearchParams(searchParams);
              params.delete("category");
              setActiveCategory("ทั้งหมด");
              setSearchParams(params);
            }}
            className={`flex h-[80px] w-[80px] cursor-pointer flex-col items-center justify-center rounded-[10px] border px-[20px] py-[12px] duration-300 ${
              activeCategory === "ทั้งหมด"
                ? "text-surface bg-gradient-primary border-transparent"
                : "border-subtle-light text-subtle-dark bg-surface"
            }`}
          >
            <div className="text-[14px] font-semibold text-nowrap md:text-[16px]">
              ทั้งหมด
            </div>
          </button>

          {/* หมวดหมู่อะไหล่และบริการ */}
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
                className={`flex h-[80px] w-[80px] cursor-pointer flex-col items-center justify-center rounded-[10px] border px-[20px] py-[12px] duration-300 ${
                  isActive
                    ? "text-surface bg-gradient-primary border-transparent"
                    : "bg-surface border-subtle-light text-subtle-dark"
                }`}
              >
                <div
                  className={`flex h-[45px] w-[45px] items-center justify-center ${
                    isActive ? "text-surface" : "text-subtle-dark"
                  }`}
                >
                  <IconComponent />
                </div>
                <div className="text-[14px] font-semibold text-nowrap md:text-[16px]">
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
