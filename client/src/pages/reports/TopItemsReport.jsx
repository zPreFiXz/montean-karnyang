import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { LoaderCircle } from "lucide-react";
import ReportPeriodHeader from "@/components/reports/ReportPeriodHeader";
import { SparePart } from "@/components/icons/Icons";
import { listTopItems } from "@/api/report";
import { toastError } from "@/utils/handleError";
import { formatCurrency, formatQuantity } from "@/utils/formats";
import { formatProductName } from "@/utils/tireSize";
import { isTireCategoryName, USED_TIRE_CATEGORY } from "@/constants/categories";
import { getDateRange, getPeriodType } from "@/utils/reportPeriod";

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
  const [searchParams] = useSearchParams();
  const periodType = getPeriodType(searchParams);

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

  const rangeKey = `${periodType}:${currentDate.toDateString()}`;
  useEffect(() => {
    let isCurrent = true;
    const { startDate, endDate } = getDateRange(currentDate, periodType);
    setIsLoading(true);
    listTopItems(startDate, endDate)
      .then((res) => isCurrent && setItems(res.data || []))
      .catch((error) => isCurrent && toastError(error))
      .finally(() => isCurrent && setIsLoading(false));
    return () => {
      isCurrent = false;
    };
    // rangeKey แทน currentDate เพราะ Date เป็นตัวใหม่ทุกครั้งที่สร้าง แม้เป็นวันเดียวกัน
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey]);

  const ranked = [...items].sort((a, b) =>
    sortBy === "revenue"
      ? b.revenue - a.revenue || b.quantity - a.quantity
      : b.quantity - a.quantity || b.revenue - a.revenue,
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
        title="สินค้าขายดี"
        basePath="/admin/reports/top-items"
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

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : ranked.length > 0 ? (
          <div className="space-y-[12px] pt-[16px]">
            {ranked.map((item, index) => {
              const rank = index + 1;
              const name = itemName(item);
              const imageUrl = item.part?.secureUrl;
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
              ไม่มียอดขายอะไหล่
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopItemsReport;
