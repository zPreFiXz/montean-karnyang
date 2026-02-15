import { Link } from "react-router";
import { Calendar, TrendingUp } from "lucide-react";
import useAuthStore from "@/stores/useAuthStore";
import useRepairStore from "@/stores/useRepairStore";
import { formatCurrency, formatDate } from "@/utils/formats";

const DateAndSale = () => {
  const { getTodaySales } = useRepairStore();
  const { user } = useAuthStore();
  const todaySales = getTodaySales();

  return (
    <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-[24px]">
      {/* วันที่ปัจจุบัน */}
      <div className="flex items-center gap-[10px]">
        <Calendar className="text-primary h-[22px] w-[22px]" />
        <span className="text-normal text-[18px] font-medium">
          วันที่ {formatDate(new Date())}
        </span>
      </div>

      {/* ยอดขายวันนี้เฉพาะ ADMIN */}
      {user?.role === "ADMIN" && (
        <>
          <div className="bg-subtle-light h-[28px] w-[1px]" />
          <Link
            to="/admin/reports/sales?period=daily"
            className="group flex items-center gap-[10px] transition-opacity hover:opacity-80"
          >
            <TrendingUp className="text-primary h-[22px] w-[22px]" />
            <span className="text-normal text-[18px] font-medium">
              ยอดขายวันนี้
            </span>
            <span className="text-primary mb-0.5 text-[22px] font-semibold">
              {formatCurrency(todaySales)}
            </span>
          </Link>
        </>
      )}
    </div>
  );
};
export default DateAndSale;
