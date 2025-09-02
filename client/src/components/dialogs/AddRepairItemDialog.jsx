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

const AddRepairItemDialog = ({ children, onAddItem, selectedItems = [] }) => {
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
    // คำนวณจำนวนที่เหลือจริงหลังจากหักที่เลือกไปแล้ว
    const selectedQuantity =
      selectedItems.find(
        (selected) =>
          selected.partNumber === item.partNumber &&
          selected.brand === item.brand &&
          selected.name === item.name
      )?.quantity || 0;

    const remainingStock = (item.stockQuantity || 0) - selectedQuantity;

    if (item.partNumber && item.brand && remainingStock <= 0) {
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
        className="flex flex-col w-full h-[90vh] max-h-[650px] p-0"
        showCloseButton={false}
      >
        <DialogHeader className="relative flex-shrink-0 pt-[16px]">
          <DialogTitle className="text-center font-athiti font-semibold text-[22px] text-subtle-dark">
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
            className="absolute top-[16px] right-[20px] flex items-center justify-center w-[32px] h-[32px] rounded-full bg-black/5"
          >
            <X size={18} className="text-subtle-dark" />
          </button>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 flex flex-col">
          <div className="flex-shrink-0 flex flex-col px-[20px]">
            {/* แถบค้นหา */}
            <div className="relative flex items-center mt-[4px]">
              <div className="absolute left-[16px] flex items-center h-full text-subtle-dark pointer-events-none">
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
                className="w-full h-[41px] px-[40px] rounded-[20px] font-athiti bg-surface focus:outline-none"
                style={{
                  "--tw-ring-color": "#1976d2",
                  "--tw-border-opacity": "1",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#1976d2";
                  e.target.style.borderWidth = "2px";
                  e.target.style.boxShadow = "0 0 0 3px rgba(13, 71, 161, 0.3)";
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
            <div className="overflow-x-auto px-[20px] mt-[14px] -mx-[20px] font-athiti">
              <div className="flex gap-[8px] py-[2px]">
                <button
                  onClick={() => handleCategoryChange("ทั้งหมด")}
                  tabIndex={-1}
                  className={`flex flex-col items-center justify-center w-[80px] h-[80px] px-[20px] py-[12px] rounded-[10px] border duration-200 ${
                    activeCategory === "ทั้งหมด"
                      ? "border-transparent text-surface bg-gradient-primary "
                      : "border-subtle-light text-subtle-dark bg-surface"
                  }`}
                >
                  <div className="font-semibold text-[14px] text-nowrap">
                    ทั้งหมด
                  </div>
                </button>
                {categories.map((item, index) => {
                  const IconComponent = item.icon;
                  const isActive = activeCategory === item.name;
                  return (
                    <button
                      key={index}
                      onClick={() => handleCategoryChange(item.name)}
                      tabIndex={-1}
                      className={`flex flex-col justify-center items-center w-[80px] h-[80px] px-[20px] py-[12px] border rounded-[10px] duration-200 ${
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
                        {item.name}
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
          </div>

          {/* รายการอะไหล่และบริการ */}
          <div className="flex-1 px-[20px] pb-[16px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <LoaderCircle className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : inventory.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="font-athiti font-medium text-subtle-light">
                  ไม่พบอะไหล่และบริการ
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {inventory.map((item, index) => {
                  // คำนวณจำนวนที่เหลือจริงหลังจากหักที่เลือกไปแล้ว
                  const selectedQuantity =
                    selectedItems.find(
                      (selected) =>
                        selected.partNumber === item.partNumber &&
                        selected.brand === item.brand &&
                        selected.name === item.name
                    )?.quantity || 0;

                  const remainingStock =
                    (item.stockQuantity || 0) - selectedQuantity;

                  const isDisabled =
                    item.partNumber && item.brand && remainingStock <= 0;

                  return (
                    <div
                      key={index}
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
                        stockQuantity={remainingStock}
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
