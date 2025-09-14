import { useState, useRef } from "react";
import InventoryCard from "@/components/cards/InventoryCard";
import SearchBar from "@/components/forms/SearchBar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoaderCircle, X } from "lucide-react";
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

const AddRepairItemDialog = ({
  children,
  onAddItem,
  selectedItems = [],
  restoredStockMap = {},
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [categories, setCategories] = useState([]);
  const [searchValue, setSearchValue] = useState("");

  // เก็บค่า stock ที่ถูกคืนในโหมดแก้ไขแบบถาวรระหว่างที่ dialog เปิดอยู่
  const restoredStockMapRef = useRef({});

  const buildPartKey = (item) =>
    `${item.partNumber || ""}|${item.brand || ""}|${item.name || ""}`;

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

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    const categoryParam = category === "ทั้งหมด" ? null : category;
    const searchParam = searchValue || null;
    handleFilter(categoryParam, searchParam);
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    // สร้าง baseline stock (ที่คืนในโหมดแก้ไข) จากรายการที่เลือกไว้ตอนเปิด dialog
    const baseline = { ...restoredStockMap };
    for (const selected of selectedItems) {
      if (selected.partNumber && selected.brand) {
        const key = buildPartKey(selected);
        if (typeof selected.stockQuantity === "number") {
          baseline[key] = Math.max(baseline[key] || 0, selected.stockQuantity);
        }
      }
    }
    restoredStockMapRef.current = baseline;
    if (categories.length === 0) {
      fetchCategories();
    }
    handleFilter(null, null);
    setActiveCategory("ทั้งหมด");
    setSearchValue("");
  };

  const handleAddItemToRepair = (item) => {
    // รวมจำนวนที่เลือกไว้ทั้งหมดสำหรับอะไหล่เดียวกัน (ไม่แยกซ้าย/ขวา)
    const selectedQuantity = selectedItems.reduce((sum, selected) => {
      const isSamePart =
        selected.partNumber === item.partNumber &&
        selected.brand === item.brand &&
        selected.name === item.name;
      return isSamePart ? sum + (selected.quantity || 0) : sum;
    }, 0);

    // ใช้ baseline ที่บันทึกไว้ขณะ dialog เปิด เพื่อให้สต็อกคืนเต็มแม้ลบรายการทั้งหมดแล้ว
    const key = buildPartKey(item);
    const displayStock =
      typeof restoredStockMapRef.current[key] === "number"
        ? restoredStockMapRef.current[key]
        : item.stockQuantity || 0;

    // จำนวนที่ยังสามารถเพิ่มได้ = สต็อกที่แสดงผล - จำนวนที่เลือกไว้แล้ว
    const remainingAddable = (displayStock || 0) - selectedQuantity;

    if (item.partNumber && item.brand && remainingAddable <= 0) {
      return;
    }
    // ส่ง stockQuantity เป็นค่า baseline (displayStock) เพื่อให้ปุ่ม + จำกัดตามสต็อกที่คืนแล้ว
    onAddItem({ ...item, stockQuantity: displayStock });
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
          <DialogTitle className="text-center font-athiti font-semibold text-[22px] md:text-[24px] text-subtle-dark">
            เลือกอะไหล่หรือบริการ
          </DialogTitle>
          <DialogDescription className="sr-only">
            เลือกอะไหล่หรือบริการที่ต้องการเพิ่มลงในรายการซ่อม
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
            <div className="mt-[4px]">
              <SearchBar
                placeholder="ค้นหารหัส, ยี่ห้อ, ชื่ออะไหล่"
                onSearch={(value) => {
                  setSearchValue(value);
                  debouncedSearch(value);
                }}
                value={searchValue}
                inputMode="none"
              />
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
                  <div className="font-semibold text-[14px] md:text-[16px] text-nowrap">
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
                      <div className="font-semibold text-[14px] md:text-[16px] text-nowrap">
                        {item.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between mt-[14px]">
              <p className="font-athiti font-semibold text-[20px] md:text-[22px]">
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
                <p className="font-athiti font-medium text-[20px] md:text-[22px] text-subtle-light">
                  ไม่พบอะไหล่และบริการ
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {inventory.map((item, index) => {
                  // รวมจำนวนที่เลือกไว้ทั้งหมดสำหรับอะไหล่เดียวกัน (ไม่แยกซ้าย/ขวา)
                  const selectedQuantity = selectedItems.reduce(
                    (sum, selected) => {
                      const isSamePart =
                        selected.partNumber === item.partNumber &&
                        selected.brand === item.brand &&
                        selected.name === item.name;
                      return isSamePart ? sum + (selected.quantity || 0) : sum;
                    },
                    0
                  );

                  // ใช้ baseline ที่บันทึกไว้ขณะ dialog เปิด เพื่อให้สต็อกคืนเต็มแม้ลบรายการทั้งหมดแล้ว
                  const key = buildPartKey(item);
                  const displayStock =
                    typeof restoredStockMapRef.current[key] === "number"
                      ? restoredStockMapRef.current[key]
                      : item.stockQuantity || 0;

                  // จำนวนที่ยังสามารถเพิ่มได้
                  const remainingAddable =
                    (displayStock || 0) - selectedQuantity;

                  const isDisabled =
                    item.partNumber && item.brand && remainingAddable <= 0;

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
                        stockQuantity={Math.max(remainingAddable, 0)}
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
