import { Link } from "react-router";
import { Calendar, TrendingUp } from "lucide-react";
import DropdownListMenu from "./DropdownListMenu";
import Logo from "./Logo";
import useRepairStore from "@/stores/repairStore";
import useAuthStore from "@/stores/authStore";
import { formatCurrency } from "@/lib/utils";

const Navbar = () => {
  const { getTodaySales } = useRepairStore();
  const { user } = useAuthStore();
  const todaySales = getTodaySales();

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
    <div className="shadow-primary relative hidden h-[73px] w-full items-center justify-between pr-[24px] pl-[43px] xl:flex">
      <Logo />

      {/* วันที่และยอดขายวันนี้ */}
      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-[24px]">
        {/* วันที่ */}
        <div className="flex items-center gap-[10px]">
          <Calendar className="text-primary h-[22px] w-[22px]" />
          <span className="text-normal text-[18px] font-medium">
            {getCurrentDateThai()}
          </span>
        </div>

        {/* ยอดขายวันนี้ - เฉพาะ ADMIN */}
        {user?.role === "ADMIN" && (
          <>
            <div className="bg-subtle-light h-[28px] w-[1px]" />
            <Link
              to="/admin/reports/sales/daily"
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

      <DropdownListMenu />
    </div>
  );
};
export default Navbar;
