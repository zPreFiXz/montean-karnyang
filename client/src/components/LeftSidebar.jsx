import {
  BoxSearch,
  CarRepair,
  DashboardBar,
  Document,
  Plus,
} from "./icons/Icon";
import { useLocation, Link } from "react-router";

const LeftSidebar = () => {
  const location = useLocation();
  const menuItems = [
    { path: "/dashboard", label: "แดชบอร์ด", icon: DashboardBar },
    { path: "/check-suspension", label: "เช็คช่วงล่าง", icon: CarRepair },
    { path: "/history", label: "ประวัติลูกค้า", icon: Document },
    { path: "/settings", label: "สต็อกอะไหล่", icon: BoxSearch },
  ];

  return (
    <div
      className="hidden lg:flex flex-col items-center w-[269px] min-h-[calc(100vh-73px)] gap-[24px] px-[16px] shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]"
    >
      <Link to="/new" className="flex justify-center items-center w-[237px] h-[65px] mt-[24px] gap-[8px] rounded-[10px] bg-gradient-to-r from-[#5b46f4] to-[#8663f8] hover:opacity-90 hover:scale-[1.03] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
        <Plus />
        <p className="font-medium text-[22px] text-surface">รายการซ่อมใหม่</p>
      </Link>

      {menuItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path}
            className="w-full flex justify-center"
          >
            <div
              className={`group flex justify-center items-center w-[237px] h-[65px] gap-[22px] rounded-[10px] transition-all duration-300 ease-out cursor-pointer ${
                isActive
                  ? "border-2 border-primary bg-surface shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]"
                  : "border-2 border-black/10 hover:border-2 hover:border-primary hover:bg-surface hover:shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)] hover:scale-[1.03] hover:-translate-y-1"
              }`}
            >
              <Icon isActive={isActive} />
              <p
                className={`font-medium text-[22px] ${
                  isActive ? "text-primary" : "text-subtle-dark group-hover:text-primary"
                }`}
              >
                {item.label}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
export default LeftSidebar;
