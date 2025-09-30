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
    { path: "/dashboard", label: "หน้าหลัก", icon: DashboardBar },
    { path: "/inspections/suspension", label: "เช็กช่วงล่าง", icon: CarRepair },
    { path: "/vehicles", label: "ประวัติลูกค้า", icon: Document },
    { path: "/inventory", label: "สต็อกอะไหล่", icon: BoxSearch },
  ];

  return (
    <div className="hidden xl:flex flex-col items-center w-[269px] min-h-[calc(100vh-73px)] gap-[24px] px-[16px] shadow-primary">
      <Link
        to="/repair/new"
        className="flex justify-center items-center w-[237px] h-[65px] gap-[8px] mt-[24px] rounded-[10px] bg-gradient-primary hover:opacity-90 duration-300 cursor-pointer"
      >
        <Plus size="sm" />
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
              className={`group flex justify-center items-center w-[237px] h-[65px] gap-[22px] rounded-[10px] duration-300 cursor-pointer ${
                isActive
                  ? "border-2 border-primary bg-surface shadow-primary"
                  : "border-2 border-black/10 hover:border-2 hover:bg-surface hover:border-primary"
              }`}
            >
              <Icon isActive={isActive} size="md" />
              <p
                className={`font-medium text-[22px] duration-300 ${
                  isActive
                    ? "text-primary"
                    : "text-subtle-dark group-hover:text-primary"
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
