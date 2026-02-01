import { BoxSearch, CarRepair, DashboardBar, Document, Plus } from "./icons/Icons";
import { useLocation, Link } from "react-router";

const LeftSidebar = () => {
  const location = useLocation();
  const menuItems = [
    { path: "/dashboard", label: "หน้าหลัก", icon: DashboardBar },
    { path: "/inspections/suspension", label: "เช็กช่วงล่าง", icon: CarRepair },
    { path: "/vehicles", label: "ประวัติลูกค้า", icon: Document },
    { path: "/inventories", label: "สต็อกอะไหล่", icon: BoxSearch },
  ];

  // ตรวจสอบว่า path ปัจจุบันตรงกับ menu item หรือเป็น nested route
  const isActivePath = (path) => {
    // dashboard ใช้ exact match เท่านั้น
    if (path === "/dashboard") {
      return location.pathname === path;
    }
    // ประวัติลูกค้า active ทั้ง /vehicles และ /repairs/:id (ยกเว้น /repairs/new, /repairs/summary, /repairs/status)
    if (path === "/vehicles") {
      const isRepairDetail =
        location.pathname.startsWith("/repairs/") &&
        !location.pathname.includes("/new") &&
        !location.pathname.includes("/summary") &&
        !location.pathname.includes("/status");
      return (
        location.pathname === path ||
        location.pathname.startsWith(path + "/") ||
        isRepairDetail
      );
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <div className="shadow-primary hidden min-h-[calc(100vh-73px)] w-[269px] flex-col items-center gap-[24px] px-[16px] xl:flex">
      <Link
        to="/repairs/new"
        className="bg-gradient-primary shadow-primary mt-[24px] flex h-[65px] w-[237px] cursor-pointer items-center justify-center gap-[8px] rounded-[10px] duration-300 hover:opacity-90"
      >
        <Plus size="sm" />
        <p className="text-surface text-[22px] font-medium">รายการซ่อมใหม่</p>
      </Link>

      {menuItems.map((item) => {
        const isActive = isActivePath(item.path);
        const Icon = item.icon;

        return (
          <Link key={item.path} to={item.path} className="flex w-full justify-center">
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
