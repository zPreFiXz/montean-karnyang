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
import { ICON_MAP, DEFAULT_ICON } from "@/components/icons/categoryIcons";
import { useDebouncedCallback } from "use-debounce";
import { getInventory } from "@/api/inventory";
import { getCategories } from "@/api/category";

const AddRepairItemDialog = ({
  children,
  onAddItem,
  selectedItems = [],
  restoredStockMap = {},
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [categories, setCategories] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const restoredStockMapRef = useRef({});

  const buildPartKey = (item) =>
    `${item.partNumber || ""}|${item.brand || ""}|${item.name || ""}`;

  const handleFilter = async (category, search) => {
    setIsLoading(true);
    try {
      const res = await getInventory(category, search);
      setInventory(res.data);
    } catch (error) {
      console.log(error);
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
          icon: ICON_MAP[category.name] || DEFAULT_ICON,
        }))
        .sort((a, b) => a.id - b.id);
      setCategories(categoriesWithIcons);
    } catch (error) {
      console.log(error);
    }
  };

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
    const selectedQuantity = selectedItems.reduce((sum, selected) => {
      const isSamePart =
        selected.partNumber === item.partNumber &&
        selected.brand === item.brand &&
        selected.name === item.name;
      return isSamePart ? sum + (selected.quantity || 0) : sum;
    }, 0);

    const key = buildPartKey(item);
    const displayStock =
      typeof restoredStockMapRef.current[key] === "number"
        ? restoredStockMapRef.current[key]
        : item.stockQuantity || 0;

    const remainingAddable = (displayStock || 0) - selectedQuantity;

    if (item.partNumber && item.brand && remainingAddable <= 0) {
      return;
    }

    onAddItem({ ...item, stockQuantity: displayStock });
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger onClick={handleOpenDialog} asChild>
        {children}
      </DialogTrigger>
      <DialogContent
        className="flex h-[90vh] max-h-[650px] w-full flex-col p-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader className="relative flex-shrink-0 pt-[16px]">
          <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-semibold md:text-[24px]">
            เลือกอะไหล่หรือบริการ
          </DialogTitle>
          <DialogDescription className="sr-only">
            เลือกอะไหล่หรือบริการที่ต้องการเพิ่มลงในรายการซ่อม
          </DialogDescription>
          <button
            onClick={() => setIsDialogOpen(false)}
            autoFocus={false}
            tabIndex={-1}
            aria-label="ปิดหน้าต่าง"
            className="absolute top-[16px] right-[20px] flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-full bg-black/5"
          >
            <X size={18} className="text-subtle-dark" />
          </button>
        </DialogHeader>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-shrink-0 flex-col px-[20px]">
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

            <div className="font-athiti -mx-[20px] mt-[14px] overflow-x-auto px-[20px]">
              <div className="flex gap-[8px] py-[2px]">
                <button
                  onClick={() => handleCategoryChange("ทั้งหมด")}
                  tabIndex={-1}
                  className={`flex h-[80px] w-[80px] cursor-pointer flex-col items-center justify-center rounded-[10px] border px-[20px] py-[12px] duration-300 ${
                    activeCategory === "ทั้งหมด"
                      ? "text-surface bg-gradient-primary border-transparent "
                      : "border-subtle-light text-subtle-dark bg-surface"
                  }`}
                >
                  <div className="text-[14px] font-semibold text-nowrap md:text-[16px]">
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
                      className={`flex h-[80px] w-[80px] cursor-pointer flex-col items-center justify-center rounded-[10px] border px-[20px] py-[12px] duration-300 ${
                        isActive
                          ? "text-surface bg-gradient-primary border-transparent"
                          : "border-subtle-light text-subtle-dark bg-surface"
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
              </div>
            </div>

            <div className="mt-[14px] flex items-center justify-between">
              <p className="font-athiti text-[20px] font-semibold md:text-[22px]">
                รายการอะไหล่และบริการ
              </p>
            </div>
          </div>

          <div className="flex-1 px-[20px] pb-[16px]">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
              </div>
            ) : inventory.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="font-athiti text-subtle-light text-[20px] font-medium md:text-[22px]">
                  ไม่พบอะไหล่และบริการ
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {inventory.map((item, index) => {
                  const selectedQuantity = selectedItems.reduce(
                    (sum, selected) => {
                      const isSamePart =
                        selected.partNumber === item.partNumber &&
                        selected.brand === item.brand &&
                        selected.name === item.name;
                      return isSamePart ? sum + (selected.quantity || 0) : sum;
                    },
                    0,
                  );

                  const key = buildPartKey(item);
                  const displayStock =
                    typeof restoredStockMapRef.current[key] === "number"
                      ? restoredStockMapRef.current[key]
                      : item.stockQuantity || 0;

                  const remainingAddable =
                    (displayStock || 0) - selectedQuantity;

                  const isDisabled =
                    item.partNumber && item.brand && remainingAddable <= 0;

                  return (
                    <div
                      key={index}
                      onClick={() => handleAddItemToRepair(item)}
                      className={`font-athiti rounded-lg ${
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
                        minStockLevel={item.minStockLevel}
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
