import { Link } from "react-router";
import { Calendar, TrendingUp } from "lucide-react";
import useAuthStore from "@/stores/useAuthStore";
import useRepairStore from "@/stores/useRepairStore";
import { formatCurrency, formatDate } from "@/utils/formats";

// วันที่เป็นข้อมูลประกอบ ยอดขายเป็นป้ายกดได้ (เปิดรายงานยอดขายของวันนี้)
const NavbarStats = () => {
  const { getTodaySales } = useRepairStore();
  const { user } = useAuthStore();
  const todaySales = getTodaySales();

  return (
    <div className="flex items-center gap-4">
      <div className="text-subtle-dark flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        <span className="text-lg font-medium">
          วันที่ {formatDate(new Date())}
        </span>
      </div>

      {user?.role === "ADMIN" && (
        <Link
          to="/admin/reports/sales?period=daily"
          className="bg-primary/5 hover:bg-primary/10 flex h-11 items-center gap-2 rounded-lg px-3 duration-200"
        >
          <TrendingUp className="text-primary h-5 w-5" />
          <span className="text-subtle-dark text-lg font-medium">
            ยอดขายวันนี้
          </span>
          <span className="text-primary text-xl font-semibold">
            {formatCurrency(todaySales)}
          </span>
        </Link>
      )}
    </div>
  );
};
export default NavbarStats;
