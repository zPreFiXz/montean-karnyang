import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { LoaderCircle } from "lucide-react";
import ReportPeriodHeader from "@/components/reports/ReportPeriodHeader";
import { SparePart } from "@/components/icons/Icons";
import { listTopItems, listTopVehicleModels } from "@/api/report";
import BrandIcons from "@/components/icons/BrandIcons";
import { getDisplayBrand } from "@/utils/repairDisplay";
import { toastError } from "@/utils/handleError";
import { formatCurrency, formatQuantity } from "@/utils/formats";
import { formatProductName } from "@/utils/tireSize";
import { isTireCategoryName, USED_TIRE_CATEGORY } from "@/constants/categories";
import { getDateRange, getPeriodType } from "@/utils/reportPeriod";

// ดูได้สองแบบในช่วงเวลาเดียวกัน อะไหล่ที่ขายดี กับรุ่นรถที่มาบ่อย (ใช้ตัดสินใจว่าควรเก็บอะไหล่รุ่นไหน)
const VIEWS = [
  { id: "parts", label: "อะไหล่" },
  { id: "models", label: "รุ่นรถ" },
];

const SORTS = [
  { id: "quantity", label: "ขายได้มากสุด" },
  { id: "revenue", label: "ยอดขายสูงสุด" },
];

// ยางต้องเอาขนาดมาต่อชื่อ ไม่งั้นยางยี่ห้อเดียวกันหลายขนาดจะชื่อเหมือนกันหมด
const itemName = (item) =>
  item.part
    ? formatProductName({
        brand: item.part.brand,
        name: item.part.name,
        attributes: item.part.attributes,
        isTire: isTireCategoryName(item.part.category),
        isUsedTire: item.part.category === USED_TIRE_CATEGORY,
      })
    : item.name;

// สามอันดับแรกเด่นกว่าที่เหลือ อ่านปุ๊บรู้ว่าอะไรขายดีที่สุด
const rankClass = (rank) =>
  rank <= 3 ? "bg-primary text-surface" : "bg-primary/10 text-primary";

const TopItemsReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const periodType = getPeriodType(searchParams);
  // เก็บไว้ใน URL กดเข้าหน้าอื่นแล้วย้อนกลับมายังอยู่แท็บเดิม
  const view = searchParams.get("view") === "models" ? "models" : "parts";
  const setView = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next === "models") params.set("view", "models");
    else params.delete("view");
    setSearchParams(params, { replace: true, state: location.state });
  };

  const [currentDate, setCurrentDate] = useState(() =>
    location.state?.currentDate
      ? new Date(location.state.currentDate)
      : new Date(),
  );
  const [sortBy, setSortBy] = useState("quantity");
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // กดแท็บช่วงเวลาจะส่งวันนี้มาใน state เหมือนรายงานยอดขาย
  useEffect(() => {
    if (location.state?.currentDate) {
      setCurrentDate(new Date(location.state.currentDate));
    }
  }, [location.state?.currentDate]);

  const rangeKey = `${view}:${periodType}:${currentDate.toDateString()}`;
  useEffect(() => {
    let isCurrent = true;
    const { startDate, endDate } = getDateRange(currentDate, periodType);
    setIsLoading(true);
    setItems([]);
    (view === "models" ? listTopVehicleModels : listTopItems)(
      startDate,
      endDate,
    )
      .then((res) => isCurrent && setItems(res.data || []))
      .catch((error) => isCurrent && toastError(error))
      .finally(() => isCurrent && setIsLoading(false));
    return () => {
      isCurrent = false;
    };
    // rangeKey แทน currentDate เพราะ Date เป็นตัวใหม่ทุกครั้งที่สร้าง แม้เป็นวันเดียวกัน
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey]);

  // รุ่นรถนับเป็นครั้งที่มา อะไหล่นับเป็นจำนวนชิ้น
  const countOf = (item) => (view === "models" ? item.visits : item.quantity);
  // รุ่นรถเรียงตามที่มาบ่อยอย่างเดียว ไม่มีปุ่มเรียง
  const ranked = [...items].sort((a, b) =>
    sortBy === "revenue" && view === "parts"
      ? b.revenue - a.revenue || countOf(b) - countOf(a)
      : countOf(b) - countOf(a) || b.revenue - a.revenue,
  );
  const totalRevenue = items.reduce((sum, item) => sum + item.revenue, 0);

  // เข้าได้จากรายงานยอดขายทางเดียว ย้อนกลับจึงไปหน้านั้นทันที
  // แท็บช่วงเวลาไม่ซ้อนประวัติ (ดู ReportPeriodHeader) ย้อนครั้งเดียวก็ถึง
  // เปิดหน้านี้ตรงๆ จากลิงก์ ไม่มีหน้าก่อนให้ถอย จึงไปรายงานยอดขายแทน
  const handleBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/admin/reports/sales");
  };

  return (
    <div>
      <ReportPeriodHeader
        title={view === "models" ? "รุ่นรถที่มาบ่อย" : "สินค้าขายดี"}
        // ช่วงเวลาเปลี่ยนแล้วยังอยู่แท็บเดิม (หัวรายงานต่อ period ท้ายลิงก์)
        basePath={`/admin/reports/top-items${view === "models" ? "?view=models" : ""}`}
        periodType={periodType}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onBack={handleBack}
      >
        <p className="text-surface text-[32px] font-semibold md:text-[34px]">
          {formatCurrency(totalRevenue)}
        </p>
      </ReportPeriodHeader>

      <div className="bg-surface -mt-[16px] flex min-h-[calc(100svh-249px)] w-full flex-col rounded-tl-2xl rounded-tr-2xl px-[20px] pb-[112px] md:min-h-[calc(100svh-269px)] xl:pb-[16px]">
        {/* เรียงตามจำนวนชิ้นหรือยอดเงิน ของถูกขายบ่อยกับของแพงขายไม่กี่ชิ้นได้อันดับต่างกัน
            ปุ่มแคปซูลชุดเดียวกับแท็บใบเสร็จ/ใบสั่งซ่อมในหน้าตัวอย่างใบเสร็จ */}
        {/* สลับสิ่งที่ดู แบบเดียวกับแท็บซ้าย/ขวา/อื่นๆ ในหน้าเช็กช่วงล่าง (แถบไล่สีเลื่อนตามแท็บที่เลือก) */}
        <div
          role="tablist"
          className="relative mt-[16px] flex w-full rounded-[10px] bg-gray-100 p-1"
        >
          <div
            aria-hidden="true"
            className="bg-gradient-primary absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/2)] rounded-[10px] shadow-lg duration-300 ease-out"
            style={{
              transform: `translateX(${view === "models" ? 100 : 0}%)`,
            }}
          />
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={view === item.id}
              onClick={() => setView(item.id)}
              className={`relative z-10 flex h-10 flex-1 cursor-pointer items-center justify-center rounded-[10px] text-lg font-semibold duration-300 ease-out md:text-xl ${
                view === item.id ? "text-white" : "text-subtle-dark"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {view === "parts" && (
          <div className="flex gap-[8px] pt-[16px]">
            {SORTS.map((sort) => (
              <button
                key={sort.id}
                type="button"
                onClick={() => setSortBy(sort.id)}
                aria-pressed={sortBy === sort.id}
                className={`h-[38px] flex-1 cursor-pointer rounded-[20px] border text-lg font-semibold duration-300 md:text-xl ${
                  sortBy === sort.id
                    ? "bg-primary text-surface border-transparent"
                    : "border-subtle-light text-subtle-dark bg-surface"
                }`}
              >
                {sort.label}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : ranked.length > 0 ? (
          <div className="space-y-[12px] pt-[16px]">
            {view === "models" &&
              ranked.map((item, index) => {
                const rank = index + 1;
                return (
                  <div
                    key={item.key}
                    className="bg-surface shadow-primary flex h-[80px] items-center gap-[8px] rounded-[10px] px-[8px]"
                  >
                    <div
                      className={`flex h-[28px] min-w-[28px] shrink-0 items-center justify-center rounded-full px-[6px] text-base font-semibold ${rankClass(rank)}`}
                    >
                      {rank}
                    </div>
                    <div className="bg-primary flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-full">
                      <BrandIcons brand={item.brand} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="text-normal truncate text-base font-semibold md:text-lg">
                        {getDisplayBrand(item)}
                      </p>
                      {/* คันเดียวมาหลายครั้งนับครั้งตามบิล คันบอกว่ามีรถรุ่นนี้กี่คันจริง */}
                      <p className="text-subtle-dark truncate text-base font-medium md:text-lg">
                        {`${item.visits} ครั้ง · ${item.vehicles} คัน`}
                      </p>
                    </div>
                    <p className="text-primary shrink-0 text-[22px] font-semibold text-nowrap md:text-2xl">
                      {formatCurrency(item.revenue)}
                    </p>
                  </div>
                );
              })}
            {view === "parts" &&
              ranked.map((item, index) => {
                const rank = index + 1;
                const name = itemName(item);
                const imageUrl = item.secureUrl;
                return (
                  <div
                    key={item.key}
                    className="bg-surface shadow-primary flex h-[80px] items-center gap-[8px] rounded-[10px] px-[8px]"
                  >
                    <div
                      className={`flex h-[28px] min-w-[28px] shrink-0 items-center justify-center rounded-full px-[6px] text-base font-semibold ${rankClass(rank)}`}
                    >
                      {rank}
                    </div>
                    <div className="bg-surface flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[10px] border border-gray-200">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={name}
                          className="h-full w-full rounded-[10px] object-cover"
                        />
                      ) : (
                        <SparePart className="text-subtle-light h-10 w-10" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="text-normal line-clamp-2 text-base font-semibold break-words md:text-lg">
                        {name}
                      </p>
                      <p className="text-subtle-dark truncate text-base font-medium md:text-lg">
                        {`${formatQuantity(item.quantity)} ${item.unit || ""}`.trim()}
                      </p>
                    </div>
                    <p className="text-primary shrink-0 text-[22px] font-semibold text-nowrap md:text-2xl">
                      {formatCurrency(item.revenue)}
                    </p>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-subtle-light text-center text-xl text-balance md:text-[22px]">
              {view === "models" ? "ไม่มีรถเข้าซ่อม" : "ไม่มียอดขายอะไหล่"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopItemsReport;
