import CarCard from "@/components/cards/CarCard";
import InventoryCard from "@/components/cards/InventoryCard";
import ItemDetailDialog from "@/components/dialogs/ItemDetailDialog";
import StatusCard from "@/components/cards/StatusCard";
import { Success, Wrench, Paid, Car } from "@/components/icons/Icon";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { formatCurrency, formatTime } from "@/lib/utils";
import useRepairStore from "@/stores/repairStore";
import useAuthStore from "@/stores/authStore";
import { getInventory } from "@/api/inventory";
import {
  Menu,
  CircleUserRound,
  LogOut,
  X,
  CarFront,
  Users,
  LoaderCircle,
} from "lucide-react";

const Dashboard = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemDetail, setShowItemDetail] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const {
    fetchRepairs,
    getRepairCountByStatus,
    getTodaySales,
    getLatestRepairByStatus,
  } = useRepairStore();

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchRepairs();
    loadInventory();
  }, [fetchRepairs]);

  const loadInventory = async () => {
    try {
      setIsLoadingInventory(true);
      const res = await getInventory(null, null);
      setInventory(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingInventory(false);
    }
  };

  // ยอดขายวันนี้
  const todaySales = getTodaySales();

  // นับจำนวนการซ่อมแต่ละสถานะ
  const inProgressCount = getRepairCountByStatus("IN_PROGRESS");
  const completedCount = getRepairCountByStatus("COMPLETED");
  const paidCount = getRepairCountByStatus("PAID");

  // การซ่อมล่าสุดของแต่ละสถานะ
  const latestInProgress = getLatestRepairByStatus("IN_PROGRESS");
  const latestCompleted = getLatestRepairByStatus("COMPLETED");
  const latestPaid = getLatestRepairByStatus("PAID");

  // สรุปสต็อก
  const stockItems = inventory.filter((i) => i?.category?.name !== "บริการ");
  const outOfStockItems = stockItems.filter(
    (i) => Number(i?.stockQuantity || 0) <= 0
  );
  const lowStockItems = stockItems.filter((i) => {
    const qty = Number(i?.stockQuantity || 0);
    const min = Number(i?.minStockLevel || 0);
    return qty > 0 && min > 0 && qty <= min;
  });

  const topNames = (arr) =>
    arr
      .slice(0, 3)
      .map((i) =>
        i?.brand ? `${i.brand} ${i.name || ""}` : i?.name || "รายการไม่ระบุ"
      );

  const handleLogout = async () => {
    setIsLoggingOut(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      localStorage.setItem("justLoggedOut", "true");
      logout();

      navigate("/login", { replace: true });
    } catch (error) {
      console.error(error);
      setIsLoggingOut(false);
    }
  };

  const getCurrentDateThai = () => {
    const now = new Date();
    const thaiMonths = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];

    const day = now.getDate();
    const month = thaiMonths[now.getMonth()];
    const year = now.getFullYear() + 543;

    return `วันที่ ${day} ${month} ${year}`;
  };

  return (
    <div className="w-full">
      {/* มุมมองเดสก์ท็อป */}
      <div className="hidden xl:block w-full px-[24px]">
        {/* ยอดขาย (เฉพาะแอดมิน) */}
        {user?.role === "ADMIN" && (
          <div className="w-fit h-[157px] p-[16px] mt-[24px] rounded-[10px] shadow-primary">
            <p className="font-medium text-[22px] text-subtle-dark">
              {getCurrentDateThai()}
            </p>
            <Link to="/admin/reports/sales/daily">
              <div className="flex justify-between items-center w-[353px] h-[80px] px-[16px] mt-[12px] rounded-[10px] bg-gradient-primary shadow-primary">
                <p className="font-medium text-[22px] text-surface">
                  ยอดขายวันนี้
                </p>
                <p className="font-medium text-[32px] text-surface">
                  {formatCurrency(todaySales)}
                </p>
              </div>
            </Link>
          </div>
        )}

        {/* สถานะการซ่อม */}
        <div className="w-full p-[16px] mt-[24px] mb-[24px] rounded-[10px] shadow-primary">
          <p className="font-medium text-[22px] text-subtle-dark">
            สถานะการซ่อม
          </p>
          <div className="grid grid-cols-3 gap-[16px] mt-[16px]">
            {/* กำลังซ่อม */}
            <div className="w-full flex flex-col">
              <Link to="/repair/status/in-progress">
                <StatusCard
                  bg="in-progress"
                  icon={Wrench}
                  label={"กำลังซ่อม"}
                  amount={inProgressCount}
                />
              </Link>
              <div className="mt-[16px] w-full">
                {latestInProgress && (
                  <Link to={`/repair/${latestInProgress.id}`}>
                    <CarCard
                      bg="in-progress"
                      color="#ffb000"
                      icon={Car}
                      licensePlate={
                        latestInProgress.vehicle?.licensePlate?.plateNumber &&
                        latestInProgress.vehicle?.licensePlate?.province
                          ? `${latestInProgress.vehicle.licensePlate.plateNumber} ${latestInProgress.vehicle.licensePlate.province}`
                          : "ไม่ระบุทะเบียนรถ"
                      }
                      brand={`${latestInProgress.vehicle?.vehicleBrandModel?.brand} ${latestInProgress.vehicle?.vehicleBrandModel?.model}`}
                      time={
                        latestInProgress.createdAt &&
                        formatTime(latestInProgress.createdAt)
                      }
                      price={parseFloat(latestInProgress.totalPrice)}
                    />
                  </Link>
                )}
              </div>
            </div>

            {/* ซ่อมเสร็จสิ้น */}
            <div className="w-full flex flex-col">
              <Link to="/repair/status/completed">
                <StatusCard
                  bg="completed"
                  icon={Success}
                  label={"ซ่อมเสร็จสิ้น"}
                  amount={completedCount}
                />
              </Link>
              <div className="mt-[16px] w-full">
                {latestCompleted && (
                  <Link to={`/repair/${latestCompleted.id}`}>
                    <CarCard
                      bg="completed"
                      color="#22c55e"
                      icon={Car}
                      licensePlate={
                        latestCompleted.vehicle?.licensePlate?.plateNumber &&
                        latestCompleted.vehicle?.licensePlate?.province
                          ? `${latestCompleted.vehicle.licensePlate.plateNumber} ${latestCompleted.vehicle.licensePlate.province}`
                          : "ไม่ระบุทะเบียนรถ"
                      }
                      brand={`${latestCompleted.vehicle?.vehicleBrandModel?.brand} ${latestCompleted.vehicle?.vehicleBrandModel?.model}`}
                      time={
                        latestCompleted.completedAt &&
                        formatTime(latestCompleted.completedAt)
                      }
                      price={parseFloat(latestCompleted.totalPrice)}
                    />
                  </Link>
                )}
              </div>
            </div>

            {/* ชำระเงินแล้ว */}
            <div className="w-full flex flex-col">
              <Link to="/repair/status/paid">
                <StatusCard
                  bg="paid"
                  icon={Paid}
                  label={"ชำระเงินแล้ว"}
                  amount={paidCount}
                />
              </Link>
              <div className="mt-[16px] w-full">
                {latestPaid && (
                  <Link to={`/repair/${latestPaid.id}`}>
                    <CarCard
                      bg="paid"
                      color="#1976d2"
                      icon={Car}
                      licensePlate={
                        latestPaid.vehicle?.licensePlate?.plateNumber &&
                        latestPaid.vehicle?.licensePlate?.province
                          ? `${latestPaid.vehicle.licensePlate.plateNumber} ${latestPaid.vehicle.licensePlate.province}`
                          : "ไม่ระบุทะเบียนรถ"
                      }
                      brand={`${latestPaid.vehicle?.vehicleBrandModel?.brand} ${latestPaid.vehicle?.vehicleBrandModel?.model}`}
                      time={latestPaid.paidAt && formatTime(latestPaid.paidAt)}
                      price={parseFloat(latestPaid.totalPrice)}
                    />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* แจ้งเตือนสต็อก */}
        {(outOfStockItems.length > 0 || lowStockItems.length > 0) && (
          <div className="w-full p-[16px] mb-[16px] rounded-[10px] bg-surface shadow-primary">
            <p className="font-medium text-[22px] text-subtle-dark flex items-center gap-2">
              แจ้งเตือนสต็อก
            </p>
            <div className="mt-[16px]">
              <div>
                {outOfStockItems.slice(0, 5).map((item) => (
                  <div
                    key={`desk-out-${item.id}`}
                    onClick={() => {
                      setSelectedItem(item);
                      setShowItemDetail(true);
                    }}
                  >
                    <InventoryCard
                      item={item}
                      brand={item.brand}
                      name={item.name}
                      unit={item.unit}
                      sellingPrice={item.sellingPrice}
                      stockQuantity={item.stockQuantity}
                      minStockLevel={item.minStockLevel}
                      typeSpecificData={item.typeSpecificData}
                      secureUrl={item.secureUrl}
                      category={item.category?.name}
                    />
                  </div>
                ))}
                {lowStockItems.slice(0, 5).map((item) => (
                  <div
                    key={`desk-low-${item.id}`}
                    onClick={() => {
                      setSelectedItem(item);
                      setShowItemDetail(true);
                    }}
                  >
                    <InventoryCard
                      item={item}
                      brand={item.brand}
                      name={item.name}
                      unit={item.unit}
                      sellingPrice={item.sellingPrice}
                      stockQuantity={item.stockQuantity}
                      minStockLevel={item.minStockLevel}
                      typeSpecificData={item.typeSpecificData}
                      secureUrl={item.secureUrl}
                      category={item.category?.name}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* มุมมองมือถือ */}
      <div className="xl:hidden">
        <div
          className={`w-full ${
            user?.role === "ADMIN" ? "h-[222px] md:h-[228px]" : "h-[134px]"
          } pt-[16px] px-[20px] bg-gradient-primary`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-semibold text-[32px] md:text-[34px] text-surface">
                มณเฑียรการยาง
              </p>
              <p className="font-medium text-[20px] md:text-[22px] text-surface">
                {getCurrentDateThai()}
              </p>
            </div>

            {/* Hamburger Menu */}
            <div>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`flex items-center justify-center w-12 h-12 mt-2 rounded-xl bg-surface backdrop-blur-sm duration-500 ${
                  isMenuOpen ? "bg-surface" : "bg-surface"
                }`}
              >
                <Menu className="w-6 h-6 text-primary" />
              </button>

              {/* Menu */}
              <div
                className={`z-50 fixed inset-0 bg-surface transform duration-500 ease-in-out ${
                  isMenuOpen ? "translate-x-0" : "translate-x-full"
                } ${!isMenuOpen ? "pointer-events-none" : ""}`}
              >
                <div className="h-[104px] px-[20px] py-[16px] bg-gradient-primary">
                  <div className="flex items-center justify-between">
                    <div className="flex justify-center items-center gap-[16px]">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-surface/20">
                        <CircleUserRound className="w-7 h-7 text-surface" />
                      </div>
                      <div>
                        <p className="font-semibold text-[20px] md:text-[22px] text-surface">
                          {user?.fullName}
                        </p>
                        <p className="text-surface text-[18px] md:text-[20px]">
                          {user?.role === "ADMIN" ? "แอดมิน" : "พนักงาน"}
                        </p>
                      </div>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center w-12 h-12 bg-surface rounded-xl"
                    >
                      <X className="w-6 h-6 text-primary" />
                    </button>
                  </div>
                </div>
                <div className="px-[20px] py-[16px] -mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface">
                  <div>
                    {/* จัดการยี่ห้อและรุ่นรถ */}
                    <Link
                      to="/vehicle-brand-models"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center w-full gap-[16px] p-[16px] mb-[16px] rounded-[12px] bg-surface shadow-primary duration-300"
                    >
                      <div className="flex items-center justify-center w-[48px] h-[48px] rounded-[10px] bg-primary">
                        <CarFront className="w-[24px] h-[24px] text-surface" />
                      </div>
                      <p className="font-semibold text-[18px] md:text-[20px]text-normal">
                        จัดการยี่ห้อและรุ่นรถ
                      </p>
                    </Link>

                    {/* จัดการบัญชีพนักงาน */}
                    {user?.role === "ADMIN" && (
                      <Link
                        to="/admin/employees"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center w-full gap-[16px] p-[16px] mb-[16px] rounded-[12px] bg-surface shadow-primary duration-300"
                      >
                        <div className="flex items-center justify-center w-[48px] h-[48px] rounded-[10px] bg-completed">
                          <Users className="w-[24px] h-[24px] text-surface" />
                        </div>
                        <p className="font-semibold text-[18px] md:text-[20px] text-normal">
                          จัดการบัญชีพนักงาน
                        </p>
                      </Link>
                    )}
                  </div>

                  {/* ออกจากระบบ */}
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className={`flex items-center gap-[16px] w-full p-[16px] rounded-[12px] bg-surface shadow-primary duration-300 ${
                      isLoggingOut ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <div className="flex items-center justify-center w-[48px] h-[48px] rounded-[10px] bg-delete">
                      {isLoggingOut ? (
                        <LoaderCircle className="w-[24px] h-[24px] text-surface animate-spin" />
                      ) : (
                        <LogOut className="w-[24px] h-[24px] text-surface" />
                      )}
                    </div>
                    <p className="font-semibold text-[18px] md:text-[20px] text-normal">
                      {isLoggingOut ? "ออกจากระบบ..." : "ออกจากระบบ"}
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {user?.role === "ADMIN" && (
            <Link
              to="/admin/reports/sales/daily"
              className="flex justify-between items-center w-full h-[80px] px-[16px] mx-auto mt-[16px] rounded-[10px] bg-surface shadow-primary"
            >
              <p className="font-semibold text-[22px] md:text-[24px] text-normal">
                ยอดขายวันนี้
              </p>
              <p className="font-semibold text-[30px] md:text-[32px] text-primary">
                {formatCurrency(todaySales)}
              </p>
            </Link>
          )}
        </div>
        <div className="flex flex-col w-full gap-[16px] px-[20px] -mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface">
          <p className="pt-[16px] font-semibold text-[22px] md:text-[24px] text-normal">
            สถานะการซ่อม
          </p>
          <Link to="/repair/status/in-progress">
            <CarCard
              bg="in-progress"
              color="#ffb000"
              icon={Wrench}
              status={"กำลังซ่อม"}
              amount={inProgressCount > 0 ? inProgressCount : "0"}
            />
          </Link>
          <Link to="/repair/status/completed">
            <CarCard
              bg="completed"
              color="#22c55e"
              icon={Success}
              status={"ซ่อมเสร็จสิ้น"}
              amount={completedCount > 0 ? completedCount : "0"}
            />
          </Link>
          <Link to="/repair/status/paid">
            <CarCard
              bg="paid"
              color="#1976d2"
              icon={Paid}
              status={"ชำระเงินแล้ว"}
              amount={paidCount > 0 ? paidCount : "0"}
            />
          </Link>
        </div>

        {/* แจ้งเตือนสต็อก */}
        {(outOfStockItems.length > 0 || lowStockItems.length > 0) && (
          <div className="flex flex-col w-full px-[20px] pb-[24px] rounded-[12px] bg-surface">
            <p className="pt-[16px] font-semibold text-[22px] md:text-[24px] text-normal flex items-center gap-2">
              แจ้งเตือนสต็อก
            </p>
            <div className="pb-[88px]">
              {outOfStockItems.slice(0, 5).map((item) => (
                <div
                  key={`m-out-${item.id}`}
                  onClick={() => {
                    setSelectedItem(item);
                    setShowItemDetail(true);
                  }}
                >
                  <InventoryCard
                    item={item}
                    brand={item.brand}
                    name={item.name}
                    unit={item.unit}
                    sellingPrice={item.sellingPrice}
                    stockQuantity={item.stockQuantity}
                    minStockLevel={item.minStockLevel}
                    typeSpecificData={item.typeSpecificData}
                    secureUrl={item.secureUrl}
                    category={item.category?.name}
                  />
                </div>
              ))}
              {lowStockItems.slice(0, 5).map((item) => (
                <div
                  key={`m-low-${item.id}`}
                  onClick={() => {
                    setSelectedItem(item);
                    setShowItemDetail(true);
                  }}
                >
                  <InventoryCard
                    item={item}
                    brand={item.brand}
                    name={item.name}
                    unit={item.unit}
                    sellingPrice={item.sellingPrice}
                    stockQuantity={item.stockQuantity}
                    minStockLevel={item.minStockLevel}
                    typeSpecificData={item.typeSpecificData}
                    secureUrl={item.secureUrl}
                    category={item.category?.name}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dialog รายละเอียดสินค้า */}
        <ItemDetailDialog
          item={selectedItem}
          open={showItemDetail}
          onOpenChange={setShowItemDetail}
          onStockUpdate={loadInventory}
        />
      </div>
    </div>
  );
};
export default Dashboard;
