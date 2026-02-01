import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, LoaderCircle, Calendar as CalendarIcon } from "lucide-react";
import CarCard from "@/components/cards/CarCard";
import { Calendar } from "@/components/ui/calendar";
import { CalendarMonth } from "@/components/ui/CalendarMonth";
import { formatCurrency } from "@/lib/utils";
import { provinces } from "@/utils/data";
import useRepairStore from "@/stores/repairStore";
import { getBrandIcon } from "@/components/icons/BrandIcons";
import { CalendarYear } from "@/components/ui/CalendarYear";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
      repairs: periodPaidRepairs.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt)),
    };
  };

  // แปลงข้อมูลรถสำหรับ CarCard
  const getCarCardData = (repair) => {
    const vehicle = repair.vehicle;
    const licensePlate =
      vehicle?.licensePlate?.plateNumber && vehicle?.licensePlate?.province
        ? `${vehicle.licensePlate.plateNumber} ${getProvinceName(vehicle.licensePlate.province)}`
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
        newDate.setFullYear(newDate.getFullYear() + (direction === "next" ? 1 : -1));
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
      <div className="bg-gradient-primary h-[265px] w-full px-[20px] py-[16px] md:h-[285px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[8px]">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-surface mt-[2px] cursor-pointer"
            >
              <ChevronLeft />
            </button>
            <p className="text-surface text-[24px] font-semibold md:text-[26px]">รายงานยอดขาย</p>
          </div>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button className="text-surface flex cursor-pointer items-center gap-[8px]">
                <CalendarIcon className="h-5 w-5" />
                <p className="text-[20px] font-semibold md:text-[22px]">
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
        <div className="mt-[16px] flex justify-center gap-[16px]">
          <Link
            to="/admin/reports/sales/daily"
            state={{ currentDate: new Date().toISOString() }}
            className={`flex h-[35px] w-[78px] items-center justify-center rounded-[10px] border-2 text-[18px] font-semibold md:h-[40px] md:w-[95px] md:text-[20px] ${
              location.pathname === "/admin/reports/sales/daily"
                ? "text-surface bg-primary border-white"
                : "border-subtle-light text-subtle-light bg-surface"
            }`}
          >
            วัน
          </Link>
          <Link
            to="/admin/reports/sales/weekly"
            state={{ currentDate: new Date().toISOString() }}
            className={`flex h-[35px] w-[78px] items-center justify-center rounded-[10px] border-2 text-[18px] font-semibold md:h-[40px] md:w-[95px] md:text-[20px] ${
              location.pathname === "/admin/reports/sales/weekly"
                ? "text-surface bg-primary border-white"
                : "border-subtle-light text-subtle-light bg-surface"
            }`}
          >
            สัปดาห์
          </Link>
          <Link
            to="/admin/reports/sales/monthly"
            state={{ currentDate: new Date().toISOString() }}
            className={`flex h-[35px] w-[78px] items-center justify-center rounded-[10px] border-2 text-[18px] font-semibold md:h-[40px] md:w-[95px] md:text-[20px] ${
              location.pathname === "/admin/reports/sales/monthly"
                ? "text-surface bg-primary border-white"
                : "border-subtle-light text-subtle-light bg-surface"
            }`}
          >
            เดือน
          </Link>
          <Link
            to="/admin/reports/sales/yearly"
            state={{ currentDate: new Date().toISOString() }}
            className={`flex h-[35px] w-[78px] items-center justify-center rounded-[10px] border-2 text-[18px] font-semibold md:h-[40px] md:w-[95px] md:text-[20px] ${
              location.pathname === "/admin/reports/sales/yearly"
                ? "text-surface bg-primary border-white"
                : "border-subtle-light text-subtle-light bg-surface"
            }`}
          >
            ปี
          </Link>
        </div>
        <div className="flex items-center justify-center pt-[16px]">
          <div className="text-surface text-[22px] font-semibold md:text-[24px]">
            {getDisplayDate()}
          </div>
        </div>
        <div className="mt-[16px] flex w-full items-center justify-between px-[20px]">
          <button
            onClick={() => changeDate("prev")}
            className="bg-surface flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-full md:h-[48px] md:w-[48px]"
          >
            <ChevronLeft
              className="text-primary mr-[2px] h-[24px] w-[24px] md:h-[26px] md:w-[26px]"
              strokeWidth={2.5}
            />
          </button>
          <div className="flex flex-col items-center">
            <p className="text-surface text-[32px] font-semibold md:text-[34px]">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
          <button
            onClick={() => changeDate("next")}
            className="bg-surface flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-full md:h-[48px] md:w-[48px]"
          >
            <ChevronRight
              className="text-primary ml-[2px] h-[24px] w-[24px] md:h-[26px] md:w-[26px]"
              strokeWidth={2.5}
            />
          </button>
        </div>
      </div>
      <div className="bg-surface -mt-[16px] flex min-h-[calc(100vh-249px)] w-full flex-col rounded-tl-2xl rounded-tr-2xl px-[20px] md:min-h-[calc(100vh-269px)]">
        <div className="pt-[16px]">
          <p className="text-normal text-[22px] font-semibold md:text-[24px]">
            {periodRepairs.length > 0
              ? `รายการซ่อม (${periodRepairs.length} รายการ)`
              : "รายการซ่อม"}
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-[256px] items-center justify-center">
            <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : periodRepairs.length > 0 ? (
          <div className={`${periodType === "daily" ? "pt-[16px]" : "pt-[8px]"} pb-[96px]`}>
            {periodType === "daily"
              ? periodRepairs.map((repair, index) => {
                  const carData = getCarCardData(repair);
                  return (
                    <Link
                      to={`/repairs/${repair.id}`}
                      key={index}
                      className={index > 0 ? "mt-[16px] block" : "block"}
                      state={{
                        returnTo: location.pathname,
                        currentDate: currentDate.toISOString(),
                      }}
                    >
                      <CarCard
                        bg="primary"
                        color="#1976d2"
                        icon={getBrandIcon(repair.vehicle.vehicleBrandModel.brand, "#1976d2")}
                        licensePlate={carData.licensePlate}
                        brand={carData.brand}
                        time={carData.time}
                        price={carData.price}
                      />
                    </Link>
                  );
                })
              : Object.entries(groupRepairsByDay(periodRepairs)).map(([day, repairsForDay]) => (
                  <div key={day} className="mb-4">
                    <p className="text-subtle-dark mb-[8px] text-[18px] font-medium md:text-[20px]">
                      {day}
                    </p>
                    {repairsForDay.map((repair, i) => {
                      const carData = getCarCardData(repair);
                      return (
                        <Link
                          to={`/repairs/${repair.id}`}
                          key={i}
                          className={i > 0 ? "mt-[12px] block" : "block"}
                          state={{
                            returnTo: location.pathname,
                            currentDate: currentDate.toISOString(),
                          }}
                        >
                          <CarCard
                            bg="primary"
                            color="#1976d2"
                            icon={getBrandIcon(repair.vehicle.vehicleBrandModel.brand, "#1976d2")}
                            licensePlate={carData.licensePlate}
                            brand={carData.brand}
                            time={carData.time}
                            price={carData.price}
                          />
                        </Link>
                      );
                    })}
                  </div>
                ))}
          </div>
        ) : (
          <div className="flex h-[256px] flex-col items-center justify-center text-center">
            <p className="text-subtle-light text-[20px] md:text-[22px]">ไม่มีรายการซ่อม</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReport;
