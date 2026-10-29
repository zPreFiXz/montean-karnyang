import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Menu,
  CircleUserRound,
  LogOut,
  X,
  LoaderCircle,
  ShoppingBag,
  Wrench as WrenchOutline,
} from "lucide-react";
import CarCard from "@/components/cards/CarCard";
import OutlineCardIcon from "@/components/icons/OutlineCardIcon";
import InventoryCard from "@/components/cards/InventoryCard";
import RepairItemDetailDialog from "@/components/dialogs/RepairItemDetailDialog";
import StatusCard from "@/components/cards/StatusCard";
import { listInventory } from "@/api/inventory";
import { listCategories } from "@/api/category";
import {
  formatCurrency,
  formatDateWithWeekday,
  formatTime,
} from "@/utils/formats";
import useRepairStore from "@/stores/useRepairStore";
import useAuthStore from "@/stores/useAuthStore";
import { Success, Wrench, Paid } from "@/components/icons/Icons";
import BrandIcons from "@/components/icons/BrandIcons";
import { toastError } from "@/utils/handleError";
import { onKeyActivate } from "@/utils/a11y";
import { tracksStock } from "@/utils/stock";
import { MANAGEMENT_LINKS, ADMIN_LINKS } from "@/constants/menu";
import { roleLabel } from "@/utils/role";
import {
  isSaleRepair,
  isNoVehicleRepair,
  getRepairTitle,
  getRepairSubtitle,
} from "@/utils/repairDisplay";
import { usePrefetchPages } from "@/routes/pageImports";
import { useReopenStockItem } from "@/hooks/useReopenStockItem";
import {
  useScrollRestoration,
  useScrollTracking,
} from "@/utils/scrollPosition";

// จำของที่โหลดไว้ กดย้อนกลับมาจะเลื่อนกลับไปที่เดิมได้ทันที
let cachedInventory = null;
let cachedCategoryOrder = [];

const Dashboard = () => {
  usePrefetchPages(["RepairList", "RepairDetail", "RepairCreate"]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [inventory, setInventory] = useState(cachedInventory || []);
  const [isInventoryLoading, setIsInventoryLoading] =
    useState(!cachedInventory);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isItemDetailOpen, setIsItemDetailOpen] = useState(false);
  useReopenStockItem((item) => {
    setSelectedItem(item);
    setIsItemDetailOpen(true);
  });
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const {
    repairs,
    fetchRepairs,
    getRepairCountByStatus,
    getTodaySales,
    getRepairsByStatus,
  } = useRepairStore();
  const [isRepairsLoading, setIsRepairsLoading] = useState(
    repairs.length === 0,
  );

  useEffect(() => {
    fetchRepairs().finally(() => setIsRepairsLoading(false));
    fetchInventory();
  }, [fetchRepairs]);

  // กุญแจ "/" ตรงกับที่ไดอะล็อกรายละเอียดอะไหล่จำไว้ตอนพาออกไปหน้าอื่น
  useScrollTracking("/");
  useScrollRestoration("/", !isInventoryLoading && !isRepairsLoading);

  const fetchInventory = async () => {
    if (!cachedInventory) setIsInventoryLoading(true);
    try {
      const res = await listInventory(null, null);
      cachedInventory = res.data || [];
      setInventory(cachedInventory);
    } catch (error) {
      toastError(error);
    } finally {
      setIsInventoryLoading(false);
    }
  };

  const todaySales = getTodaySales();

  const inProgressCount = getRepairCountByStatus("IN_PROGRESS");
  const completedCount = getRepairCountByStatus("COMPLETED");
  const paidCount = getRepairCountByStatus("PAID");

  const inProgressRepairs = getRepairsByStatus("IN_PROGRESS");
  const completedRepairs = getRepairsByStatus("COMPLETED");
  const paidRepairs = getRepairsByStatus("PAID");

  const stockItems = inventory.filter((i) => i?.category?.name !== "บริการ");
  // อะไหล่ที่ไม่ได้สต็อกไว้ (ขั้นต่ำ = 0) เหลือ 0 เป็นเรื่องปกติ ไม่นับว่าของหมด
  const outOfStockItems = stockItems.filter(
    (i) => tracksStock(i?.minStockLevel) && Number(i?.stockQuantity || 0) <= 0,
  );
  const lowStockItems = stockItems.filter((i) => {
    const qty = Number(i?.stockQuantity || 0);
    const min = Number(i?.minStockLevel || 0);
    return qty > 0 && min > 0 && qty < min;
  });
  // แสดงครบทุกรายการ ไม่ตัดจำนวน
  const stockAlertCount = outOfStockItems.length + lowStockItems.length;

  const [categoryOrder, setCategoryOrder] = useState(cachedCategoryOrder);
  useEffect(() => {
    listCategories()
      .then((res) => {
        cachedCategoryOrder = [...(res.data || [])]
          .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
          .map((c) => c.name);
        setCategoryOrder(cachedCategoryOrder);
      })
      .catch(() => {});
  }, []);

  const stockAlertGroups = useMemo(() => {
    const groups = new Map();
    for (const item of [...outOfStockItems, ...lowStockItems]) {
      const name = item?.category?.name || "อื่นๆ";
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(item);
    }
    const rank = (name) => {
      const i = categoryOrder.indexOf(name);
      return i === -1 ? categoryOrder.length : i;
    };
    return [...groups.entries()]
      .map(([name, items]) => ({ name, items }))
      .sort((a, b) => rank(a.name) - rank(b.name));
  }, [outOfStockItems, lowStockItems, categoryOrder]);

  const renderStockAlerts = (keyPrefix) =>
    stockAlertGroups.map((group, index) => (
      <div key={`${keyPrefix}-${group.name}`}>
        {stockAlertGroups.length > 1 && (
          <div className={`flex items-center gap-2 ${index > 0 ? "mt-4" : ""}`}>
            <p className="text-subtle-dark text-lg font-semibold md:text-xl">
              {group.name}
            </p>
            <span className="text-subtle-light text-lg md:text-xl">
              ({group.items.length})
            </span>
            <div className="bg-subtle-light/40 h-px flex-1" />
          </div>
        )}
        {group.items.map((item) => renderStockCard(item, keyPrefix))}
      </div>
    ));

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      localStorage.setItem("justLoggedOut", "true");
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      toastError(error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const openItem = (item) => {
    setSelectedItem(item);
    setIsItemDetailOpen(true);
  };

  const renderStockCard = (item, keyPrefix) => (
    <div
      key={`${keyPrefix}-${item.id}`}
      role="button"
      tabIndex={0}
      onKeyDown={onKeyActivate(() => openItem(item))}
      onClick={() => openItem(item)}
      className="mt-4 cursor-pointer rounded-lg"
    >
      <InventoryCard
        item={item}
        brand={item.brand}
        name={item.name}
        unit={item.unit}
        sellingPrice={item.sellingPrice}
        quantity={item.stockQuantity}
        minStockLevel={item.minStockLevel}
        attributes={item.attributes}
        tireLots={item.tireLots}
        secureUrl={item.secureUrl}
        category={item.category?.name}
        soldPriceRange={item.soldPriceRange}
        oilSource={item.oilSource}
      />
    </div>
  );

  const renderRepairColumn = (repairs, bg, iconColor, timeKey) => (
    <div className="flex flex-col gap-3">
      {repairs.length > 0 ? (
        repairs.map((repair) => (
          <Link key={repair.id} to={`/repairs/${repair.id}`}>
            <CarCard
              bg={bg}
              icon={
                isSaleRepair(repair) ? (
                  <OutlineCardIcon icon={ShoppingBag} color={iconColor} />
                ) : isNoVehicleRepair(repair) ? (
                  <OutlineCardIcon icon={WrenchOutline} color={iconColor} />
                ) : (
                  <BrandIcons
                    brand={repair.vehicle?.vehicleModel?.brand}
                    color={iconColor}
                  />
                )
              }
              licensePlate={getRepairTitle(repair)}
              brand={getRepairSubtitle(repair)}
              time={repair[timeKey] && formatTime(repair[timeKey])}
              price={parseFloat(repair.totalPrice)}
            />
          </Link>
        ))
      ) : (
        <p className="text-subtle-light py-6 text-center text-xl">
          ไม่มีงานซ่อม
        </p>
      )}
    </div>
  );

  return (
    <div className="w-full">
      <div className="hidden w-full px-5 xl:block">
        <div className="bg-surface shadow-primary mt-6 mb-6 w-full rounded-lg p-4">
          <p className="text-subtle-dark text-[22px] font-medium">
            สถานะบิล
          </p>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <Link to="/repairs?status=in-progress">
              <StatusCard
                bg="progress"
                icon={Wrench}
                label={"กำลังซ่อม"}
                amount={inProgressCount}
              />
            </Link>
            <Link to="/repairs?status=completed">
              <StatusCard
                bg="completed"
                icon={Success}
                label={"ซ่อมเสร็จสิ้น"}
                amount={completedCount}
              />
            </Link>
            <Link to="/repairs?status=paid">
              <StatusCard
                bg="paid"
                icon={Paid}
                label={"ชำระเงินแล้ว"}
                amount={paidCount}
              />
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            {renderRepairColumn(
              inProgressRepairs,
              "progress",
              "#ffb000",
              "createdAt",
            )}
            {renderRepairColumn(
              completedRepairs,
              "completed",
              "#22c55e",
              "completedAt",
            )}
            {renderRepairColumn(paidRepairs, "paid", undefined, "paidAt")}
          </div>
        </div>

        {/* กันที่ไว้ระหว่างโหลด ไม่งั้นกล่องโผล่ทีหลังแล้วดันเนื้อหาเลื่อน */}
        {(isInventoryLoading ||
          outOfStockItems.length > 0 ||
          lowStockItems.length > 0) && (
          <div className="bg-surface shadow-primary mb-4 w-full rounded-lg p-4">
            <p className="text-subtle-dark flex items-center gap-2 text-[22px] font-medium">
              แจ้งเตือนสต็อก{!isInventoryLoading && ` (${stockAlertCount})`}
            </p>
            <div className="mt-4">
              {isInventoryLoading ? (
                <div className="flex h-20 items-center justify-center">
                  <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div>{renderStockAlerts("desk")}</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="xl:hidden">
        <div
          className={`w-full ${
            user?.role === "ADMIN" ? "h-55.5 md:h-57" : "h-33.5"
          } bg-gradient-primary px-5 pt-4`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-surface text-[32px] font-semibold md:text-[34px]">
                มณเฑียรการยาง
              </p>
              <p className="text-surface text-xl font-medium md:text-[22px]">
                วัน{formatDateWithWeekday(new Date())}
              </p>
            </div>

            <div>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="เปิดเมนู"
                className="bg-surface mt-2 flex h-12 w-12 items-center justify-center rounded-xl backdrop-blur-sm duration-500"
              >
                <Menu className="text-primary h-6 w-6" />
              </button>

              <div
                className={`bg-surface fixed inset-0 z-50 transform duration-500 ease-in-out ${
                  isMenuOpen ? "translate-x-0" : "translate-x-full"
                } ${!isMenuOpen ? "pointer-events-none" : ""}`}
              >
                <div className="bg-gradient-primary h-26 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="bg-surface/20 flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
                        <CircleUserRound className="text-surface h-7 w-7" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-surface truncate text-xl font-semibold md:text-[22px]">
                          {user?.name}
                        </p>
                        <p className="text-surface/80 text-lg md:text-xl">
                          {roleLabel(user?.role)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsMenuOpen(false)}
                      aria-label="ปิดเมนู"
                      className="bg-surface flex h-12 w-12 items-center justify-center rounded-xl"
                    >
                      <X className="text-primary h-6 w-6" />
                    </button>
                  </div>
                </div>
                <div className="bg-surface -mt-4 rounded-tl-2xl rounded-tr-2xl px-5 py-4">
                  <div>
                    {/* ใช้ links.js ชุดเดียวกับเมนูจอใหญ่ */}
                    {[
                      ...MANAGEMENT_LINKS,
                      ...(user?.role === "ADMIN" ? ADMIN_LINKS : []),
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="bg-surface shadow-primary mb-4 flex w-full items-center gap-4 rounded-lg p-4 duration-300"
                        >
                          <div
                            className={`${item.tileClass} flex h-12 w-12 items-center justify-center rounded-lg`}
                          >
                            <Icon className="text-surface h-6 w-6" />
                          </div>
                          <p className="text-normal text-lg font-semibold md:text-xl">
                            {item.label}
                          </p>
                        </Link>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className={`bg-surface shadow-primary flex w-full items-center gap-4 rounded-lg p-4 duration-300 ${
                      isLoggingOut ? "cursor-not-allowed opacity-50" : ""
                    }`}
                  >
                    <div className="bg-destructive flex h-12 w-12 items-center justify-center rounded-lg">
                      {isLoggingOut ? (
                        <LoaderCircle className="text-surface h-6 w-6 animate-spin" />
                      ) : (
                        <LogOut className="text-surface h-6 w-6" />
                      )}
                    </div>
                    <p className="text-normal text-lg font-semibold md:text-xl">
                      {isLoggingOut ? "ออกจากระบบ..." : "ออกจากระบบ"}
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {user?.role === "ADMIN" && (
            <Link
              to="/admin/reports/sales?period=daily"
              className="bg-surface shadow-primary mx-auto mt-4 flex h-20 w-full items-center justify-between rounded-lg px-4"
            >
              <p className="text-normal text-[22px] font-semibold md:text-2xl">
                ยอดขายวันนี้
              </p>
              <p className="text-primary text-3xl font-semibold md:text-[32px]">
                {formatCurrency(todaySales)}
              </p>
            </Link>
          )}
        </div>
        <div className="bg-surface -mt-4 flex min-h-[calc(100svh-206px)] w-full flex-col gap-4 rounded-tl-2xl rounded-tr-2xl px-5 pb-24 md:min-h-[calc(100svh-212px)]">
          <p className="text-normal pt-4 text-[22px] font-semibold md:text-2xl">
            สถานะบิล
          </p>

          <Link to="/repairs?status=in-progress">
            <CarCard
              bg="progress"
              icon={Wrench}
              status={"กำลังซ่อม"}
              amount={inProgressCount > 0 ? inProgressCount : "0"}
            />
          </Link>

          <Link to="/repairs?status=completed">
            <CarCard
              bg="completed"
              icon={Success}
              status={"ซ่อมเสร็จสิ้น"}
              amount={completedCount > 0 ? completedCount : "0"}
            />
          </Link>

          <Link to="/repairs?status=paid">
            <CarCard
              bg="paid"
              icon={Paid}
              status={"ชำระเงินแล้ว"}
              amount={paidCount > 0 ? paidCount : "0"}
            />
          </Link>

          {(isInventoryLoading ||
            outOfStockItems.length > 0 ||
            lowStockItems.length > 0) && (
            <div
              className={`pb-4 ${
                isInventoryLoading ? "flex flex-1 flex-col" : ""
              }`}
            >
              <p className="text-normal pt-2 text-[22px] font-semibold md:text-2xl">
                แจ้งเตือนสต็อก{!isInventoryLoading && ` (${stockAlertCount})`}
              </p>
              {isInventoryLoading ? (
                <div className="flex flex-1 items-center justify-center">
                  <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>{renderStockAlerts("m")}</>
              )}
            </div>
          )}
        </div>
        <RepairItemDetailDialog
          item={selectedItem}
          open={isItemDetailOpen}
          onOpenChange={setIsItemDetailOpen}
          onStockUpdate={fetchInventory}
        />
      </div>
    </div>
  );
};
export default Dashboard;
