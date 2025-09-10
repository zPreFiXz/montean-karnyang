import CarCard from "@/components/cards/CarCard";
import StatusCard from "@/components/cards/StatusCard";
import { Success, Wrench, Paid, Car } from "@/components/icons/Icon";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { formatCurrency, formatTime } from "@/lib/utils";
import useRepairStore from "@/stores/repairStore";
import useAuthStore from "@/stores/authStore";
import {
  Menu,
  CircleUserRound,
  LogOut,
  X,
  CarFront,
  Users,
  Database,
  LoaderCircle,
} from "lucide-react";

const Dashboard = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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
  }, [fetchRepairs]);

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
      <div className="hidden lg:block w-full px-[24px]">
        {/* ยอดขาย */}
        <div className="w-fit h-[157px] p-[16px] mt-[24px] rounded-[10px] shadow-primary">
          <p className="font-medium text-[22px] text-subtle-dark">
            {getCurrentDateThai()}
          </p>
          <div className="flex justify-between items-center w-[353px] h-[80px] px-[16px] mt-[12px] rounded-[10px] bg-primary shadow-primary cursor-pointer">
            <p className="font-medium text-[22px] text-surface">ยอดขายวันนี้</p>
            <p className="font-medium text-[32px] text-surface">
              {formatCurrency(todaySales)}
            </p>
          </div>
        </div>

        {/* สถานะการซ่อม */}
        <div className="w-full p-[16px] mt-[24px] mb-[24px] rounded-[10px] shadow-primary">
          <p className="font-medium text-[22px] text-subtle-dark">
            สถานะการซ่อม
          </p>
          <div className="flex justify-start items-start gap-[16px] mt-[16px]">
            {/* กำลังซ่อม */}
            <div className="flex-1 flex-col items-center gap-[16px]">
              <StatusCard
                bg="in-progress"
                icon={Wrench}
                label={"กำลังซ่อม"}
                amount={inProgressCount}
              />
              <div className="mt-[16px]">
                {latestInProgress && (
                  <Link to="/repair/status/in-progress">
                    <CarCard
                      bg="in-progress"
                      color="#ffb000"
                      icon={Car}
                      licensePlate={`${latestInProgress.vehicle?.licensePlate?.plateNumber}
                      } ${latestInProgress.vehicle?.licensePlate?.province}`}
                      brand={`${latestInProgress.vehicle?.brand} ${latestInProgress.vehicle?.model}`}
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
            <div className="flex-1 flex-col items-center gap-[16px]">
              <StatusCard
                bg="completed"
                icon={Success}
                label={"ซ่อมเสร็จสิ้น"}
                amount={completedCount}
              />
              <div className="mt-[16px]">
                {latestCompleted && (
                  <Link to="/repair/status/completed">
                    <CarCard
                      bg="completed"
                      color="#22c55e"
                      icon={Car}
                      licensePlate={`${
                        latestCompleted.vehicle?.licensePlate?.plateNumber ||
                        "ไม่มีป้ายทะเบียน"
                      } ${latestCompleted.vehicle?.licensePlate?.province}`}
                      brand={`${latestCompleted.vehicle?.brand} ${latestCompleted.vehicle?.model}`}
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
            <div className="flex-1 flex-col items-center gap-[16px]">
              <StatusCard
                bg="paid"
                icon={Paid}
                label={"ชำระเงินแล้ว"}
                amount={paidCount}
              />
              <div className="mt-[16px]">
                {latestPaid && (
                  <Link to="/repair/status/paid">
                    <CarCard
                      bg="paid"
                      color="#1976d2"
                      icon={Car}
                      licensePlate={`${
                        latestPaid.vehicle?.licensePlate?.plateNumber ||
                        "ไม่มีป้ายทะเบียน"
                      } ${latestPaid.vehicle?.licensePlate?.province}`}
                      brand={`${latestPaid.vehicle?.brand} ${latestPaid.vehicle?.model}`}
                      time={latestPaid.paidAt && formatTime(latestPaid.paidAt)}
                      price={parseFloat(latestPaid.totalPrice)}
                    />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* มุมมองมือถือ */}
      <div className="lg:hidden">
        <div className="w-full h-[222px] md:h-[228px] pt-[16px] px-[20px] bg-gradient-primary">
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
                className={`flex items-center justify-center w-12 h-12 mt-2 rounded-xl bg-surface backdrop-blur-sm duration-500 hover:bg-surface/30 ${
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
                    {/* จัดการยี่ห้อ-รุ่นรถ */}
                    <Link
                      to="/admin/vehicle-brand-models"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center w-full gap-[16px] p-[16px] mb-[16px] rounded-[12px] bg-surface shadow-primary hover:shadow-lg duration-200"
                    >
                      <div className="flex items-center justify-center w-[48px] h-[48px] rounded-[10px] bg-primary">
                        <CarFront className="w-[24px] h-[24px] text-surface" />
                      </div>
                      <p className="font-semibold text-[18px] md:text-[20px]text-normal">
                        จัดการยี่ห้อ-รุ่นรถ
                      </p>
                    </Link>

                    {/* จัดการบัญชีพนักงาน */}
                    <Link
                      to="/admin/employees"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center w-full gap-[16px] p-[16px] mb-[16px] rounded-[12px] bg-surface shadow-primary hover:shadow-lg duration-200"
                    >
                      <div className="flex items-center justify-center w-[48px] h-[48px] rounded-[10px] bg-completed">
                        <Users className="w-[24px] h-[24px] text-surface" />
                      </div>
                      <p className="font-semibold text-[18px] md:text-[20px] text-normal">
                        จัดการบัญชีพนักงาน
                      </p>
                    </Link>

                    {/* จัดการข้อมูลระบบ */}
                    <Link
                      to="/admin/system-data"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center w-full gap-[16px] p-[16px] mb-[16px] rounded-[12px] bg-surface shadow-primary hover:shadow-lg duration-200"
                    >
                      <div className="flex items-center justify-center w-[48px] h-[48px] rounded-[10px] bg-in-progress">
                        <Database className="w-[24px] h-[24px] text-surface" />
                      </div>
                      <p className="font-semibold text-[18px] md:text-[20px] text-normal">
                        จัดการข้อมูลระบบ
                      </p>
                    </Link>
                  </div>

                  {/* ออกจากระบบ */}
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className={`flex items-center gap-[16px] w-full p-[16px] rounded-[12px] bg-surface shadow-primary hover:shadow-lg hover:bg-red-50 duration-200 ${
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

          <Link
            to="/reports/sales/daily"
            className="flex justify-between items-center w-full h-[80px] px-[16px] mx-auto mt-[16px] rounded-[10px] bg-surface shadow-primary cursor-pointer"
          >
            <p className="font-semibold text-[22px] md:text-[24px] text-normal">
              ยอดขายวันนี้
            </p>
            <p className="font-semibold text-[30px] md:text-[32px] text-primary">
              {formatCurrency(todaySales)}
            </p>
          </Link>
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
      </div>
    </div>
  );
};
export default Dashboard;
