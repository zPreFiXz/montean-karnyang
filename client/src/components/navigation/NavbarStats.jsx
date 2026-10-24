import { Link } from "react-router";
import { Calendar, TrendingUp } from "lucide-react";
import useAuthStore from "@/stores/useAuthStore";
import useRepairStore from "@/stores/useRepairStore";
import { formatCurrency, formatDate } from "@/utils/formats";

const NavbarStats = () => {
  const { getTodaySales } = useRepairStore();
  const { user } = useAuthStore();
  const todaySales = getTodaySales();

  return (
    <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-6">
      <div className="flex items-center gap-2.5">
        <Calendar className="text-primary h-5.5 w-5.5" />
        <span className="text-normal text-lg font-medium">
          วันที่ {formatDate(new Date())}
        </span>
      </div>

      {user?.role === "ADMIN" && (
        <>
          <div className="bg-subtle-light h-7 w-px" />
          <Link
            to="/admin/reports/sales?period=daily"
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <TrendingUp className="text-primary h-5.5 w-5.5" />
            <span className="text-normal text-lg font-medium">
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
export default NavbarStats;
