import { useState, useEffect } from "react";
import { toastError } from "@/utils/handleError";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import {
  saveScrollPosition,
  useScrollRestoration,
} from "@/utils/scrollPosition";
import {
  LoaderCircle,
  TrendingUp,
  Wrench as WrenchOutline,
} from "lucide-react";
import CarCard from "@/components/cards/CarCard";
import OutlineCardIcon from "@/components/icons/OutlineCardIcon";
import {
  formatCurrency,
  formatDateWithWeekday,
  formatTime,
  getProvinceName,
} from "@/utils/formats";
import useRepairStore from "@/stores/useRepairStore";
import BrandIcons from "@/components/icons/BrandIcons";
import { Paid } from "@/components/icons/Icons";
import { ShoppingBag } from "lucide-react";
import { PAYMENT_METHODS } from "@/constants/paymentMethods";
import {
  isSaleRepair,
  isNoVehicleRepair,
  getRepairTitle,
  getRepairSubtitle,
} from "@/utils/repairDisplay";
import ReportPeriodHeader from "@/components/reports/ReportPeriodHeader";
import {
  getDateRange,
  getPeriodType as periodTypeOf,
} from "@/utils/reportPeriod";

const SalesReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { repairs, fetchRepairs } = useRepairStore();
  const [isLoading, setIsLoading] = useState(repairs.length === 0);
  const [currentDate, setCurrentDate] = useState(() => {
    if (location.state?.currentDate) {
      return new Date(location.state.currentDate);
    }
    return new Date();
  });

  useEffect(() => {
    fetchRepairsData();
  }, [fetchRepairs]);

  const scrollKey = location.pathname + location.search;
  useScrollRestoration(scrollKey, !isLoading);

  useEffect(() => {
    const navDate = location.state?.currentDate;
    if (navDate) {
      setCurrentDate(new Date(navDate));
      navigate(location.pathname + location.search, {
        replace: true,
        state: {},
      });
    }
  }, [location.state?.currentDate]);

  const fetchRepairsData = async () => {
    if (repairs.length === 0) setIsLoading(true);
    try {
      await fetchRepairs();
    } catch (error) {
      toastError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPeriodType = () => periodTypeOf(searchParams);

  const getReportsData = () => {
    const periodType = getPeriodType();
    const { startDate, endDate } = getDateRange(currentDate, periodType);

    const periodPaidRepairs = repairs.filter((repair) => {
      if (repair.status !== "PAID" || !repair.paidAt) {
        return false;
      }

      const paidDate = new Date(repair.paidAt);
      return paidDate >= startDate && paidDate <= endDate;
    });

    const totalRevenue = periodPaidRepairs.reduce((total, repair) => {
      return total + parseFloat(repair.totalPrice || 0);
    }, 0);

    return {
      totalRevenue,
      repairs: periodPaidRepairs.sort(
        (a, b) => new Date(b.paidAt) - new Date(a.paidAt),
      ),
    };
  };

  const getCarCardData = (repair) => {
    const paidTime = repair.paidAt ? formatTime(repair.paidAt) : "";

    return {
      licensePlate: getRepairTitle(repair, getProvinceName),
      brand: getRepairSubtitle(repair),
      time: paidTime,
      price: parseFloat(repair.totalPrice || 0),
    };
  };

  const periodType = getPeriodType();
  const { totalRevenue, repairs: periodRepairs } = getReportsData();

  // บิลเก่าที่ไม่มีวิธีชำระเงินถือเป็นเงินสด ตรงกับค่าเริ่มต้นของฐานข้อมูล
  const revenueByPaymentMethod = PAYMENT_METHODS.map((method) => ({
    ...method,
    total: periodRepairs.reduce(
      (sum, repair) =>
        (repair.paymentMethod || "CASH") === method.id
          ? sum + Number(repair.totalPrice || 0)
          : sum,
      0,
    ),
  })).filter((method) => method.total > 0);

  const groupRepairsByDay = (repairsList) => {
    return repairsList.reduce((acc, r) => {
      const key = formatDateWithWeekday(r.paidAt || r.createdAt || new Date());
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {});
  };

  return (
    <div>
      <ReportPeriodHeader
        title="รายงานยอดขาย"
        basePath="/admin/reports/sales"
        periodType={periodType}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onBack={() => navigate("/dashboard")}
      >
        <p className="text-surface text-[32px] font-semibold md:text-[34px]">
          {formatCurrency(totalRevenue)}
        </p>
      </ReportPeriodHeader>
      <div className="bg-surface -mt-4 flex min-h-[calc(100svh-249px)] w-full flex-col rounded-tl-2xl rounded-tr-2xl px-5 pb-28 md:min-h-[calc(100svh-269px)] xl:pb-4">
        {revenueByPaymentMethod.length > 0 && (
          <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-4">
            {revenueByPaymentMethod.map((method) => (
              <div key={method.id} className="flex justify-between">
                <p className="text-subtle-dark text-lg font-medium md:text-xl">
                  {method.name}
                </p>
                <p className="text-normal text-lg font-semibold md:text-xl">
                  {formatCurrency(method.total)}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-4">
          <div className="bg-status-paid flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            <Paid />
          </div>
          <p className="text-normal text-[22px] font-semibold whitespace-nowrap md:text-2xl">
            {periodRepairs.length > 0
              ? `รายการขาย (${periodRepairs.length})`
              : "รายการขาย"}
          </p>
          <Link
            to={`/admin/reports/top-items?period=${periodType}`}
            state={{ currentDate: currentDate.toISOString() }}
            className="bg-primary/10 text-primary ml-auto flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-lg font-semibold md:text-xl"
          >
            <TrendingUp className="h-5 w-5" />
            อันดับขายดี
          </Link>
        </div>
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : periodRepairs.length > 0 ? (
          <div className={periodType === "daily" ? "pt-4" : "pt-2"}>
            {periodType === "daily"
              ? periodRepairs.map((repair, index) => {
                  const carData = getCarCardData(repair);
                  return (
                    <Link
                      to={`/repairs/${repair.id}`}
                      key={index}
                      className={index > 0 ? "mt-4 block" : "block"}
                      state={{
                        returnTo: location.pathname + location.search,
                        currentDate: currentDate.toISOString(),
                      }}
                      onClick={() => saveScrollPosition(scrollKey)}
                    >
                      <CarCard
                        bg="primary"
                        icon={
                          isSaleRepair(repair) ? (
                            <OutlineCardIcon
                              icon={ShoppingBag}
                              color="#1976d2"
                            />
                          ) : isNoVehicleRepair(repair) ? (
                            <OutlineCardIcon
                              icon={WrenchOutline}
                              color="#1976d2"
                            />
                          ) : (
                            <BrandIcons
                              brand={repair.vehicle?.vehicleModel?.brand}
                            />
                          )
                        }
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
                      <p className="text-subtle-dark mb-2 text-lg font-medium md:text-xl">
                        {day}
                      </p>
                      {repairsForDay.map((repair, i) => {
                        const carData = getCarCardData(repair);
                        return (
                          <Link
                            to={`/repairs/${repair.id}`}
                            key={i}
                            className={i > 0 ? "mt-3 block" : "block"}
                            state={{
                              returnTo: location.pathname + location.search,
                              currentDate: currentDate.toISOString(),
                            }}
                            onClick={() => saveScrollPosition(scrollKey)}
                          >
                            <CarCard
                              bg="primary"
                              icon={
                                isSaleRepair(repair) ? (
                                  <OutlineCardIcon
                                    icon={ShoppingBag}
                                    color="#1976d2"
                                  />
                                ) : isNoVehicleRepair(repair) ? (
                                  <OutlineCardIcon
                                    icon={WrenchOutline}
                                    color="#1976d2"
                                  />
                                ) : (
                                  <BrandIcons
                                    brand={repair.vehicle?.vehicleModel?.brand}
                                  />
                                )
                              }
                              licensePlate={carData.licensePlate}
                              brand={carData.brand}
                              time={carData.time}
                              price={carData.price}
                            />
                          </Link>
                        );
                      })}
                    </div>
                  ),
                )}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-subtle-light text-center text-xl text-balance md:text-[22px]">
              ไม่มีรายการขาย
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReport;
