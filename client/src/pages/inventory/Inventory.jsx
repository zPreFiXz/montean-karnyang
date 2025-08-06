import { Link, useSearchParams } from "react-router";
import { useEffect, useState, useRef } from "react";
import InventoryCard from "@/components/cards/InventoryCard";
import SearchBar from "@/components/form/SearchBar";
import CategoryList from "@/components/CategoryList";
import { getInventory } from "@/api/inventory";

const Parts = () => {
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [parts, setParts] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitializing = useRef(false);

  const category = searchParams.get("category");
  const search = searchParams.get("search");

  const handleFilter = async (category, search) => {
    try {
      const res = await getInventory(category, search);
      setParts(res.data);
    } catch (error) {
      console.error(error);
    }
  };

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
    }, 100);
  }, []);

  useEffect(() => {
    if (isInitializing.current) return;

    if (category || search) {
      handleFilter(category, search);
    } else if (!category && !search) {
      handleFilter(null, null);
    }
  }, [category, search]);

  return (
    <div className="w-full h-[78px] bg-gradient-primary shadow-primary">
      <p className="pt-[16px] pl-[20px] font-semibold text-[22px] text-surface">
        อะไหล่และบริการ
      </p>
      <div className="w-full min-h-[calc(100svh-56px)] sm:min-h-[calc(100vh-56px)] mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <div className="px-[20px] pt-[16px]">
          {/* Search Bar */}
          <SearchBar />

          {/* Category List */}
          <CategoryList
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />

          <div className="flex items-center justify-between mt-[16px]">
            <p className="font-semibold text-[18px]">รายการอะไหล่และบริการ</p>
            <Link
              to="/inventory/new"
              className="font-semibold text-[18px] text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              + เพิ่มรายการ
            </Link>
          </div>

          {/* Inventory Cards */}
          <div className="pb-[104px]">
            {parts.map((item) => (
              <div key={`${item.category.name}-${item.id}`}>
                <InventoryCard
                  brand={item.brand}
                  name={item.name}
                  unit={item.unit}
                  sellingPrice={item.sellingPrice}
                  stockQuantity={item.stockQuantity}
                  typeSpecificData={item.typeSpecificData}
                  secureUrl={item.secureUrl}
                  category={item.category.name}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Parts;
