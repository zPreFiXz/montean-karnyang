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
import { listRepairs } from "@/api/repair";
import BrandIcons from "@/components/icons/BrandIcons";
import { Paid } from "@/components/icons/Icons";
import { ShoppingBag } from "lucide-react";
import { ALL_PAYMENT_METHODS } from "@/constants/paymentMethods";
import { entryBadgeOf, salesEntriesOf } from "@/utils/salesEntries";
import {
  isSaleRepair,
  isNoVehicleRepair,
  getRepairTitle,
  getRepairSubtitle,
  hasMisfiledSuspension,
} from "@/utils/repairDisplay";
import ReportPeriodHeader from "@/components/reports/ReportPeriodHeader";
import {
  getDateRange,
  getPeriodType as periodTypeOf,
} from "@/utils/reportPeriod";

// คืนเงินเกิดจากยกเลิกบิลเท่านั้น ใช้สีแดงแบบการ์ดบิลยกเลิก
const cardBgOf = (entry) => (entry.kind === "refund" ? "cancelled" : "primary");
const iconColorOf = (entry) =>
  entry.kind === "refund" ? "#ef4444" : "#1976d2";

// จำผลของแต่ละช่วงไว้ กลับมาหรือสลับกลับมาช่วงเดิมแสดงทันที แล้วค่อยโหลดใหม่เงียบๆ
const rangeCache = new Map();

const SalesReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentDate, setCurrentDate] = useState(() => {
    if (location.state?.currentDate) {
      return new Date(location.state.currentDate);
    }
    return new Date();
  });
  // ดึงเฉพาะบิลที่มีเงินเข้าออกในช่วงที่ดู ไม่ใช้รายการบิลกลาง (เป็นบิลวันนี้กับบิลที่ยังไม่ปิด)
  const { startDate, endDate } = getDateRange(
    currentDate,
    periodTypeOf(searchParams),
  );
  const rangeKey = `${startDate.toISOString()}|${endDate.toISOString()}`;
  const [loaded, setLoaded] = useState(() =>
    rangeCache.has(rangeKey)
      ? { key: rangeKey, repairs: rangeCache.get(rangeKey) }
      : null,
  );
  const repairs =
    loaded?.key === rangeKey ? loaded.repairs : rangeCache.get(rangeKey) || [];
  const isLoading = loaded?.key !== rangeKey && !rangeCache.has(rangeKey);

  useEffect(() => {
    let cancelled = false;
    const [from, to] = rangeKey.split("|");
    listRepairs({ from, to, open: "0" })
      .then((res) => {
        rangeCache.set(rangeKey, res.data || []);
        if (!cancelled) setLoaded({ key: rangeKey, repairs: res.data || [] });
      })
      .catch((error) => {
        if (!cancelled) toastError(error);
      });
    return () => {
      cancelled = true;
    };
  }, [rangeKey]);

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

  const getPeriodType = () => periodTypeOf(searchParams);

  const getReportsData = () => {
    const entries = salesEntriesOf(repairs, (at) => {
      const date = new Date(at);
      return date >= startDate && date <= endDate;
    });

    return {
      totalRevenue: entries.reduce((total, entry) => total + entry.amount, 0),
      entries,
    };
  };

  const getCarCardData = ({ repair, kind, at, amount }) => ({
    badge: entryBadgeOf({ kind, repair }),
    licensePlate: getRepairTitle(repair, getProvinceName),
    brand: getRepairSubtitle(repair),
    time: formatTime(at),
    // ป้ายต้นบรรทัดไม่โดนตัด ต่างจากข้อความท้ายบรรทัด
    price: amount,
  });

  const periodType = getPeriodType();
  const { totalRevenue, entries: periodRepairs } = getReportsData();

  const revenueByPaymentMethod = ALL_PAYMENT_METHODS.map((method) => ({
    ...method,
    total: periodRepairs.reduce(
      (sum, entry) => (entry.method === method.id ? sum + entry.amount : sum),
      0,
    ),
  })).filter((method) => method.total !== 0);

  const groupRepairsByDay = (entries) => {
    return entries.reduce((acc, entry) => {
      const key = formatDateWithWeekday(entry.at);
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);
      return acc;
    }, {});
  };

  return (
    <div className="desktop-page">
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
          // จอคอมเป็นกล่องตัวเลขเรียงแถว มือถือเป็นรายการในกล่องเดียว
          <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-4 xl:grid xl:grid-cols-4 xl:gap-4 xl:space-y-0 xl:bg-transparent xl:p-0">
            {revenueByPaymentMethod.map((method) => (
              <div
                key={method.id}
                className="flex justify-between xl:flex-col xl:gap-1 xl:rounded-lg xl:bg-gray-50 xl:p-4"
              >
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
            {periodType === "daily" ? (
              <div className="desktop-grid flex flex-col gap-4">
                {periodRepairs.map((entry) => {
                  const repair = entry.repair;
                  const carData = getCarCardData(entry);
                  return (
                    <Link
                      to={`/repairs/${repair.id}`}
                      key={entry.key}
                      className="block"
                      state={{
                        returnTo: location.pathname + location.search,
                        currentDate: currentDate.toISOString(),
                      }}
                      onClick={() => saveScrollPosition(scrollKey)}
                    >
                      <CarCard
                        bg={cardBgOf(entry)}
                        icon={
                          isSaleRepair(repair) ? (
                            <OutlineCardIcon
                              icon={ShoppingBag}
                              color={iconColorOf(entry)}
                            />
                          ) : isNoVehicleRepair(repair) ? (
                            <OutlineCardIcon
                              icon={WrenchOutline}
                              color={iconColorOf(entry)}
                            />
                          ) : (
                            <BrandIcons
                              brand={repair.vehicle?.vehicleModel?.brand}
                              color={iconColorOf(entry)}
                            />
                          )
                        }
                        licensePlate={carData.licensePlate}
                        badge={
                          carData.badge?.label ??
                          (hasMisfiledSuspension(repair)
                            ? "มีอะไหล่ช่วงล่าง"
                            : undefined)
                        }
                        badgeTone={carData.badge?.tone}
                        brand={carData.brand}
                        time={carData.time}
                        price={carData.price}
                      />
                    </Link>
                  );
                })}
              </div>
            ) : (
              Object.entries(groupRepairsByDay(periodRepairs)).map(
                ([day, repairsForDay]) => (
                  <div key={day} className="mb-4">
                    <p className="text-subtle-dark mb-2 text-lg font-medium md:text-xl">
                      {day}
                    </p>
                    <div className="desktop-grid flex flex-col gap-3">
                      {repairsForDay.map((entry) => {
                        const repair = entry.repair;
                        const carData = getCarCardData(entry);
                        return (
                          <Link
                            to={`/repairs/${repair.id}`}
                            key={entry.key}
                            className="block"
                            state={{
                              returnTo: location.pathname + location.search,
                              currentDate: currentDate.toISOString(),
                            }}
                            onClick={() => saveScrollPosition(scrollKey)}
                          >
                            <CarCard
                              bg={cardBgOf(entry)}
                              icon={
                                isSaleRepair(repair) ? (
                                  <OutlineCardIcon
                                    icon={ShoppingBag}
                                    color={iconColorOf(entry)}
                                  />
                                ) : isNoVehicleRepair(repair) ? (
                                  <OutlineCardIcon
                                    icon={WrenchOutline}
                                    color={iconColorOf(entry)}
                                  />
                                ) : (
                                  <BrandIcons
                                    brand={repair.vehicle?.vehicleModel?.brand}
                                    color={iconColorOf(entry)}
                                  />
                                )
                              }
                              licensePlate={carData.licensePlate}
                              badge={
                                carData.badge?.label ??
                                (hasMisfiledSuspension(repair)
                                  ? "มีอะไหล่ช่วงล่าง"
                                  : undefined)
                              }
                              badgeTone={carData.badge?.tone}
                              brand={carData.brand}
                              time={carData.time}
                              price={carData.price}
                            />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ),
              )
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
