import { useState } from "react";
import InventoryCard from "@/components/cards/InventoryCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, LoaderCircle, X } from "lucide-react";
import { ToolBox, Tire, Shock, Oil } from "@/components/icons/Icon";
import { useDebouncedCallback } from "use-debounce";
import { getInventory } from "@/api/inventory";
import { getCategories } from "@/api/category";

const iconMap = {
  บริการ: ToolBox,
  ยาง: Tire,
  ยางใน: Shock,
  น้ำมันเครื่อง: Oil,
};

const AddRepairItemDialog = ({ children, onAddItem }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [categories, setCategories] = useState([]);
  const [searchValue, setSearchValue] = useState("");

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

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      const categoriesWithIcons = res.data
        .map((category) => ({
          ...category,
          icon: iconMap[category.name] || ToolBox, // ถ้าไม่มี icon ให้ใช้ ToolBox เป็นค่าเริ่มต้น
        }))
        .sort((a, b) => a.id - b.id);
      setCategories(categoriesWithIcons);
    } catch (error) {
      console.error(error);
    }
  };

  // ใช้ useDebouncedCallback เพื่อดีเลย์การค้นหา
  // ป้องกันการเรียก API บ่อยเกินไป
  const debouncedSearch = useDebouncedCallback((value) => {
    const category = activeCategory === "ทั้งหมด" ? null : activeCategory;
    handleFilter(category, value || null);
  }, 500);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    const categoryParam = category === "ทั้งหมด" ? null : category;
    const searchParam = searchValue || null;
    handleFilter(categoryParam, searchParam);
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    if (categories.length === 0) {
      fetchCategories();
    }
    handleFilter(null, null);
    setActiveCategory("ทั้งหมด");
    setSearchValue("");
  };

  const handleAddItemToRepair = (item) => {
    if (item.partNumber && item.brand && (item.stockQuantity || 0) === 0) {
      return;
    }
    onAddItem(item);
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger onClick={handleOpenDialog} asChild>
        {children}
      </DialogTrigger>
      <DialogContent
        className="p-0 w-full h-[90vh] max-h-[650px]"
        showCloseButton={false}
      >
        <DialogHeader className="pt-[16px] relative flex-shrink-0">
          <DialogTitle className="font-athiti font-semibold text-center text-[22px] text-subtle-dark">
            เลือกอะไหล่และบริการ
          </DialogTitle>
          <DialogDescription className="sr-only">
            เลือกอะไหล่และบริการที่ต้องการเพิ่มลงในรายการซ่อม
          </DialogDescription>

          {/* ปุ่มปิด dialog */}
          <button
            onClick={() => setIsDialogOpen(false)}
            autoFocus={false}
            tabIndex={-1}
            className="absolute top-[16px] right-[20px] flex items-center justify-center w-[32px] h-[32px] rounded-full bg-black/5 transition-all duration-200 hover:bg-black/10"
          >
            <X size={18} className="text-subtle-dark" />
          </button>
        </DialogHeader>
        <div className="overflow-hidden flex flex-col">
          <div className="overflow-y-auto min-h-screen px-[20px]">
            {/* แถบค้นหา */}
            <div className="relative flex items-center mt-[4px]">
              <div className="absolute left-[16px] h-full flex items-center text-subtle-dark pointer-events-none">
                <Search size={20} />
              </div>
              <Input
                type="text"
                value={searchValue}
                onChange={handleSearch}
                autoFocus={true}
                inputMode="none"
                onTouchStart={(e) => {
                  e.target.inputMode = "text";
                }}
                onClick={(e) => {
                  e.target.inputMode = "text";
                }}
                placeholder="ค้นหารหัส, ยี่ห้อ, ชื่ออะไหล่"
                className="w-full h-[40px] px-[40px] rounded-[20px] font-athiti bg-surface focus:outline-none"
                style={{
                  "--tw-ring-color": "#5b46f4",
                  "--tw-border-opacity": "1",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#5b46f4";
                  e.target.style.borderWidth = "2px";
                  e.target.style.boxShadow = "0 0 0 3px rgba(91, 70, 244, 0.3)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "";
                  e.target.style.borderWidth = "";
                  e.target.style.boxShadow = "";
                }}
              />

              {/* ปุ่มล้างการค้นหา */}
              {searchValue && (
                <button
                  onClick={() => {
                    setSearchValue("");
                    const category =
                      activeCategory === "ทั้งหมด" ? null : activeCategory;
                    handleFilter(category, null);
                  }}
                  className="absolute right-[16px] flex items-center h-full text-subtle-dark"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* แถบหมวดหมู่ */}
            <div className="overflow-x-auto -mx-[20px] px-[20px] mt-[14px] font-athiti">
              <div className="flex gap-[8px] py-[2px]">
                <button
                  onClick={() => handleCategoryChange("ทั้งหมด")}
                  tabIndex={-1}
                  className={`flex flex-col items-center justify-center w-[80px] h-[80px] px-[20px] py-[12px] border rounded-[10px] transition-all duration-200 ${
                    activeCategory === "ทั้งหมด"
                      ? "border-transparent text-surface bg-gradient-primary "
                      : "border-subtle-light text-subtle-dark bg-surface"
                  }`}
                >
                  <div className="font-semibold text-[14px] text-nowrap">
                    ทั้งหมด
                  </div>
                </button>
                {categories.map((category) => {
                  const IconComponent = category.icon;
                  const isActive = activeCategory === category.name;
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.name)}
                      tabIndex={-1}
                      className={`flex flex-col justify-center items-center w-[80px] h-[80px] px-[20px] py-[12px] border rounded-[10px] transition-all duration-200 ${
                        isActive
                          ? "border-transparent text-surface bg-gradient-primary"
                          : "border-subtle-light text-subtle-dark bg-surface"
                      }`}
                    >
                      <div
                        className={`flex justify-center items-center w-[45px] h-[45px] ${
                          isActive ? "text-surface" : "text-subtle-dark"
                        }`}
                      >
                        <IconComponent />
                      </div>
                      <div className="font-semibold text-[14px] text-nowrap">
                        {category.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between mt-[14px]">
              <p className="font-athiti font-semibold text-[18px]">
                รายการอะไหล่และบริการ
              </p>
            </div>

            {/* รายการอะไหล่และบริการ */}
            {isLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <LoaderCircle className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : inventory.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="font-medium font-athiti text-subtle-dark">
                  ไม่พบข้อมูล
                </p>
              </div>
            ) : (
              <div className="pb-[16px]">
                {inventory.map((item) => {
                  const isDisabled =
                    item.partNumber &&
                    item.brand &&
                    (item.stockQuantity || 0) === 0;

                  return (
                    <div
                      key={`${item.category.name}-${item.id}`}
                      onClick={() => handleAddItemToRepair(item)}
                      className={`rounded-lg font-athiti ${
                        isDisabled
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer"
                      }`}
                    >
                      <InventoryCard
                        brand={item.brand}
                        name={item.name}
                        unit={item.unit}
                        sellingPrice={item.sellingPrice}
                        stockQuantity={item.stockQuantity}
                        typeSpecificData={item.typeSpecificData}
                        secureUrl={item.secureUrl}
                        category={item.category.name}
                        disabled={isDisabled}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddRepairItemDialog;
