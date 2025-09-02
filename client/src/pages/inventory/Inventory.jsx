import { Link, useSearchParams } from "react-router";
import { useEffect, useState, useRef } from "react";
import InventoryCard from "@/components/cards/InventoryCard";
import SearchBar from "@/components/forms/SearchBar";
import CategoryList from "@/components/CategoryList";
import { getInventory } from "@/api/inventory";
import { LoaderCircle } from "lucide-react";

const Inventory = () => {
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitializing = useRef(false);

  const category = searchParams.get("category");
  const search = searchParams.get("search");

  const handleFilter = async (category, search) => {
    try {
      const res = await getInventory(category, search);
      setInventory(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
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
    <div className="w-full h-[83px] bg-gradient-primary shadow-primary">
      <p className="pt-[16px] pl-[20px] font-semibold text-[24px] text-surface">
        อะไหล่และบริการ
      </p>
      <div className="w-full min-h-[calc(100vh-65px)] pb-[112px] mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <div className="px-[20px] pt-[16px]">
          {/* แถบค้นหา */}
          <SearchBar placeholder="ค้นหารหัส, ยี่ห้อ, ชื่ออะไหล่" />

          {/* แถบหมวดหมู่ */}
          <CategoryList
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />

          <div className="flex items-center justify-between mt-[16px]">
            <p className="font-semibold text-[20px]">รายการอะไหล่และบริการ</p>
            <Link
              to="/inventory/new"
              className="font-semibold text-[20px] text-primary hover:text-primary/80 cursor-pointer"
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
              <p className="font-medium text-subtle-light">
                ไม่พบอะไหล่และบริการ
              </p>
            </div>
          ) : (
            inventory.map((item) => (
              <div key={`${item.category.name}-${item.id}`}>
                <Link to={`/inventory/${item.id}?type=${item.type}`}>
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
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default Inventory;
