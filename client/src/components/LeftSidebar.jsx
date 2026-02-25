import {
  BoxSearch,
  CarRepair,
  DashboardBar,
  Document,
  Plus,
} from "./icons/Icons";
import { useLocation, Link } from "react-router";

const LeftSidebar = () => {
  const location = useLocation();
  const menuItems = [
    { path: "/dashboard", label: "หน้าหลัก", icon: DashboardBar },
    { path: "/inspections/suspension", label: "เช็กช่วงล่าง", icon: CarRepair },
    { path: "/vehicles", label: "ประวัติลูกค้า", icon: Document },
    { path: "/inventory", label: "สต็อกอะไหล่", icon: BoxSearch },
  ];

  const isActivePath = (path) => {
    if (path === "/dashboard") {
      return location.pathname === path;
    }

    if (path === "/vehicles") {
      const isRepairDetail =
        location.pathname.startsWith("/repairs/") &&
        !location.pathname.includes("/new") &&
        !location.pathname.includes("/summary");
      const isRepairStatus = location.pathname === "/repairs";
      return (
        location.pathname === path ||
        location.pathname.startsWith(path + "/") ||
        (isRepairDetail && !isRepairStatus)
      );
    }
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  return (
    <div className="shadow-primary hidden min-h-[calc(100vh-73px)] w-[269px] flex-col items-center gap-[24px] px-[16px] xl:flex">
      
      {/* รายการซ่อมใหม่ */}
      <Link
        to="/repairs/new"
        className="bg-gradient-primary shadow-primary mt-[24px] flex h-[65px] w-[237px] cursor-pointer items-center justify-center gap-[8px] rounded-[10px] duration-300 hover:opacity-90"
      >
        <Plus size="sm" />
        <p className="text-surface text-[22px] font-medium">รายการซ่อมใหม่</p>
      </Link>

      {/* เมนูหลัก */}
      {menuItems.map((item) => {
        const isActive = isActivePath(item.path);
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path}
            className="flex w-full justify-center"
          >
            <div
              className={`group flex h-[65px] w-[237px] cursor-pointer items-center justify-center gap-[22px] rounded-[10px] duration-300 ${
                isActive
                  ? "border-primary bg-surface shadow-primary border-2"
                  : "hover:bg-surface hover:border-primary border-2 border-black/10 hover:border-2"
              }`}
            >
              <Icon isActive={isActive} size="md" />
              <p
                className={`text-[22px] font-medium duration-300 ${
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
