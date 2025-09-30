import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Calendar as CalendarIcon,
} from "lucide-react";
import CarCard from "@/components/cards/CarCard";
import { Car } from "@/components/icons/Icon";
import { Link, useLocation, useNavigate } from "react-router";
import useRepairStore from "@/stores/repairStore";
import { formatCurrency } from "@/lib/utils";
import { provinces } from "@/utils/data";
import { Calendar } from "@/components/ui/calendar";
import { CalendarMonth } from "@/components/ui/CalendarMonth";
import { CalendarYear } from "@/components/ui/CalendarYear";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const SalesReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { repairs, fetchRepairs } = useRepairStore();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    // ดึงวันที่จาก state ที่ส่งมา หรือใช้วันที่ปัจจุบัน
    if (location.state?.currentDate) {
      return new Date(location.state.currentDate);
    }
    return new Date();
  });

  useEffect(() => {
    loadRepairs();
  }, [fetchRepairs]);

  // ถ้ามี currentDate ถูกส่งมาจากการนำทาง ให้ตั้งค่าแล้วลบ state ออกจาก history
  useEffect(() => {
    const navDate = location.state?.currentDate;
    if (navDate) {
      setCurrentDate(new Date(navDate));
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.currentDate]);

  const loadRepairs = async () => {
    setIsLoading(true);
    try {
      await fetchRepairs();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // หา period type จาก pathname
  const getPeriodType = () => {
    if (location.pathname.includes("daily")) return "daily";
    if (location.pathname.includes("weekly")) return "weekly";
    if (location.pathname.includes("monthly")) return "monthly";
    if (location.pathname.includes("yearly")) return "yearly";
    return "daily";
  };

  // คำนวณช่วงเวลาและรายได้
  const getDateRange = (date, type) => {
    const startDate = new Date(date);
    let endDate = new Date(date);

    switch (type) {
      // วัน - เริ่มต้น 00:00:00 ถึง 23:59:59
      case "daily":
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      // สัปดาห์ - เริ่มต้นจากวันจันทร์
      case "weekly": {
        const dayOfWeek = startDate.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        startDate.setDate(startDate.getDate() - daysFromMonday);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      // เดือน
      case "monthly":
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);

        endDate.setMonth(endDate.getMonth() + 1, 1);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      // ปี
      case "yearly":
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setMonth(11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    return { startDate, endDate };
  };

  // กรองข้อมูลรายได้และรถที่มาใช้บริการ
  const getReportsData = () => {
    const periodType = getPeriodType();
    const { startDate, endDate } = getDateRange(currentDate, periodType);

    // กรองเฉพาะรายการที่ชำระเงินแล้วในช่วงเวลาที่กำหนด
    const periodPaidRepairs = repairs.filter((repair) => {
      if (repair.status !== "PAID" || !repair.paidAt) {
        return false;
      }

      const paidDate = new Date(repair.paidAt);
      return paidDate >= startDate && paidDate <= endDate;
    });

    // คำนวณรายได้รวม
    const totalRevenue = periodPaidRepairs.reduce((total, repair) => {
      return total + parseFloat(repair.totalPrice || 0);
    }, 0);

    return {
      totalRevenue,
      repairs: periodPaidRepairs.sort(
        (a, b) => new Date(b.paidAt) - new Date(a.paidAt)
      ),
    };
  };

  // แปลงข้อมูลรถสำหรับ CarCard
  const getCarCardData = (repair) => {
    const vehicle = repair.vehicle;
    const licensePlate =
      vehicle?.licensePlate?.plateNumber && vehicle?.licensePlate?.province
        ? `${vehicle.licensePlate.plateNumber} ${getProvinceName(
            vehicle.licensePlate.province
          )}`
        : "ไม่ระบุทะเบียนรถ";

    const brand = `${vehicle.vehicleBrandModel.brand} ${vehicle.vehicleBrandModel.model}`;

    const paidTime = repair.paidAt
      ? new Date(repair.paidAt).toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return {
      licensePlate,
      brand,
      time: paidTime,
      price: parseFloat(repair.totalPrice || 0),
    };
  };

  // หาชื่อจังหวัดจาก ID
  const getProvinceName = (provinceId) => {
    const province = provinces.find((p) => p.id === provinceId);
    return province ? province.name : provinceId;
  };

  // แสดงชื่อวันที่
  const getDisplayDate = () => {
    const periodType = getPeriodType();
    const { startDate, endDate } = getDateRange(currentDate, periodType);

    switch (periodType) {
      case "daily":
        return currentDate.toLocaleDateString("th-TH", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      case "weekly":
        return `${startDate.toLocaleDateString("th-TH", {
          day: "numeric",
          month: "short",
        })} - ${endDate.toLocaleDateString("th-TH", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`;
      case "monthly":
        return currentDate.toLocaleDateString("th-TH", {
          year: "numeric",
          month: "long",
        });
      case "yearly":
        return currentDate.toLocaleDateString("th-TH", {
          year: "numeric",
        });
      default:
        return "";
    }
  };

  // เปลี่ยนวันที่
  const changeDate = (direction) => {
    const periodType = getPeriodType();
    const newDate = new Date(currentDate);

    switch (periodType) {
      case "daily":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
        break;
      case "weekly":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
        break;
      case "monthly":
        newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
        break;
      case "yearly":
        newDate.setFullYear(
          newDate.getFullYear() + (direction === "next" ? 1 : -1)
        );
        break;
    }

    setCurrentDate(newDate);
  };

  // จัดการเลือกวันที่จาก Calendar
  const handleDateSelect = (date) => {
    if (date) {
      setCurrentDate(date);
      setOpen(false);
    }
  };

  const periodType = getPeriodType();
  const { totalRevenue, repairs: periodRepairs } = getReportsData();

  const groupRepairsByDay = (repairsList) => {
    return repairsList.reduce((acc, r) => {
      const d = new Date(r.paidAt || r.createdAt || Date.now());
      const key = d.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {});
  };

  return (
    <div>
      <div className="w-full h-full md:h-[285px] py-[16px] px-[20px] bg-gradient-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[8px]">
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-[2px] text-surface cursor-pointer"
            >
              <ChevronLeft />
            </button>
            <p className="font-semibold text-[24px] md:text-[26px] text-surface">
              รายงานยอดขาย
            </p>
          </div>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-[8px] text-surface cursor-pointer">
                <CalendarIcon className="w-5 h-5" />
                <p className="font-semibold text-[20px] md:text-[22px]">
                  {periodType === "yearly"
                    ? "เลือกปี"
                    : periodType === "monthly"
                    ? "เลือกเดือน"
                    : periodType === "weekly"
                    ? "เลือกสัปดาห์"
                    : "เลือกวัน"}
                </p>
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              align="end"
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              {periodType === "monthly" ? (
                <CalendarMonth
                  mode="single"
                  defaultMonth={currentDate}
                  selected={currentDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  captionLayout="dropdown"
                  monthFormat="long"
                  fromYear={2025}
                  toYear={2035}
                  className="rounded-md shadow-sm"
                  autoFocus={false}
                />
              ) : periodType === "yearly" ? (
                <CalendarYear
                  mode="single"
                  defaultMonth={currentDate}
                  selected={currentDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  captionLayout="dropdown"
                  fromYear={2025}
                  toYear={2035}
                  className="rounded-md shadow-sm"
                  autoFocus={false}
                />
              ) : (
                <Calendar
                  mode="single"
                  defaultMonth={currentDate}
                  selected={currentDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  captionLayout="dropdown"
                  monthFormat="long"
                  fromYear={2025}
                  toYear={2035}
                  className="rounded-md shadow-sm"
                  autoFocus={false}
                />
              )}
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex justify-center gap-[16px] mt-[16px]">
          <Link
            to="/admin/reports/sales/daily"
            state={{ currentDate: new Date().toISOString() }}
            className={`flex items-center justify-center w-[78px] md:w-[95px] h-[35px] md:h-[40px] rounded-[10px] border-2 font-semibold text-[18px] md:text-[20px] ${
              location.pathname === "/admin/reports/sales/daily"
                ? "border-white text-surface bg-primary"
                : "border-subtle-light text-subtle-light bg-surface"
            }`}
          >
            วัน
          </Link>
          <Link
            to="/admin/reports/sales/weekly"
            state={{ currentDate: new Date().toISOString() }}
            className={`flex items-center justify-center w-[78px] md:w-[95px] h-[35px] md:h-[40px] rounded-[10px] border-2 font-semibold text-[18px] md:text-[20px] ${
              location.pathname === "/admin/reports/sales/weekly"
                ? "border-white text-surface bg-primary"
                : "border-subtle-light text-subtle-light bg-surface"
            }`}
          >
            สัปดาห์
          </Link>
          <Link
            to="/admin/reports/sales/monthly"
            state={{ currentDate: new Date().toISOString() }}
            className={`flex items-center justify-center w-[78px] md:w-[95px] h-[35px] md:h-[40px] rounded-[10px] border-2 font-semibold text-[18px] md:text-[20px] ${
              location.pathname === "/admin/reports/sales/monthly"
                ? "border-white text-surface bg-primary"
                : "border-subtle-light text-subtle-light bg-surface"
            }`}
          >
            เดือน
          </Link>
          <Link
            to="/admin/reports/sales/yearly"
            state={{ currentDate: new Date().toISOString() }}
            className={`flex items-center justify-center w-[78px] md:w-[95px] h-[35px] md:h-[40px] rounded-[10px] border-2 font-semibold text-[18px] md:text-[20px] ${
              location.pathname === "/admin/reports/sales/yearly"
                ? "border-white text-surface bg-primary"
                : "border-subtle-light text-subtle-light bg-surface"
            }`}
          >
            ปี
          </Link>
        </div>
        <div className="flex items-center justify-center pt-[16px]">
          <div className="font-semibold text-[22px] md:text-[24px] text-surface">
            {getDisplayDate()}
          </div>
        </div>
        <div className="flex items-center justify-between w-full px-[20px] mt-[16px]">
          <button
            onClick={() => changeDate("prev")}
            className="flex items-center justify-center w-[44px] md:w-[48px] h-[44px] md:h-[48px] rounded-full bg-surface cursor-pointer"
          >
            <ChevronLeft
              className="w-[24px] md:w-[26px] h-[24px] md:h-[26px] mr-[2px] text-primary"
              strokeWidth={2.5}
            />
          </button>
          <div className="flex flex-col items-center">
            <p className="font-semibold text-[32px] md:text-[34px] text-surface">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
          <button
            onClick={() => changeDate("next")}
            className="flex items-center justify-center w-[44px] md:w-[48px] h-[44px] md:h-[48px] rounded-full bg-surface cursor-pointer"
          >
            <ChevronRight
              className="w-[24px] md:w-[26px] h-[24px] md:h-[26px] ml-[2px] text-primary"
              strokeWidth={2.5}
            />
          </button>
        </div>
      </div>
      <div className="flex flex-col w-full min-h-[calc(100vh-249px)] md:min-h-[calc(100vh-269px)] px-[20px] -mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface">
        <div className="pt-[16px]">
          <p className="font-semibold text-[22px] md:text-[24px] text-normal">
            {periodRepairs.length > 0
              ? `รายการซ่อม (${periodRepairs.length} รายการ)`
              : "รายการซ่อม"}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-[256px]">
            <LoaderCircle className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : periodRepairs.length > 0 ? (
          <div
            className={`${
              periodType === "daily" ? "pt-[16px]" : "pt-[8px]"
            }  pb-[96px]`}
          >
            {periodType === "daily"
              ? periodRepairs.map((repair, index) => {
                  const carData = getCarCardData(repair);
                  return (
                    <Link
                      to={`/repair/${repair.id}`}
                      key={index}
                      className={index > 0 ? "block mt-[16px]" : "block"}
                      state={{
                        returnTo: location.pathname,
                        currentDate: currentDate.toISOString(),
                      }}
                    >
                      <CarCard
                        bg="primary"
                        color="#1976d2"
                        icon={Car}
                        licensePlate={carData.licensePlate}
                        brand={carData.brand}
                        time={carData.time}
                        price={carData.price}
                      />
                    </Link>
                  );
                })
              : Object.entries(groupRepairsByDay(periodRepairs)).map(
                  ([day, repairsForDay]) => (
                    <div key={day} className="mb-4">
                      <p className="mb-[8px] font-medium text-[18px] md:text-[20px] text-subtle-dark">
                        {day}
                      </p>
                      {repairsForDay.map((repair, i) => {
                        const carData = getCarCardData(repair);
                        return (
                          <Link
                            to={`/repair/${repair.id}`}
                            key={i}
                            className={i > 0 ? "block mt-[12px]" : "block"}
                            state={{
                              returnTo: location.pathname,
                              currentDate: currentDate.toISOString(),
                            }}
                          >
                            <CarCard
                              bg="primary"
                              color="#1976d2"
                              icon={Car}
                              licensePlate={carData.licensePlate}
                              brand={carData.brand}
                              time={carData.time}
                              price={carData.price}
                            />
                          </Link>
                        );
                      })}
                    </div>
                  )
                )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[256px] text-center">
            <p className="text-[20px] md:text-[22px] text-subtle-light">
              ไม่มีรายการซ่อม
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReport;
