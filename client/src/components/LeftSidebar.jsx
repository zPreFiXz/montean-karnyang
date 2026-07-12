import { Link, useLocation } from "react-router";
import { Plus } from "./icons/Icons";
import { MENU_ITEMS, isActivePath } from "@/constants/menu";

// แถบเมนูซ้ายสำหรับจอ desktop
const LeftSidebar = () => {
  const location = useLocation();

  return (
    <nav className="shadow-primary hidden min-h-[calc(100vh-73px)] w-64 flex-col items-center gap-6 px-4 lg:flex">
      {/* รายการซ่อมใหม่ */}
      <Link
        to="/repairs/new"
        className="bg-gradient-primary shadow-primary mt-6 flex h-16 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] duration-300 hover:opacity-90"
      >
        <Plus size="sm" />
        <p className="text-surface text-xl font-medium">รายการซ่อมใหม่</p>
      </Link>

      {/* เมนูหลัก */}
      {MENU_ITEMS.map((item) => {
        const isActive = isActivePath(item.path, location.pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path}
            className="flex w-full justify-center"
            aria-current={isActive ? "page" : undefined}
          >
            <div
              className={`group flex h-16 w-full cursor-pointer items-center justify-center gap-5 rounded-[10px] duration-300 ${
                isActive
                  ? "border-primary bg-surface shadow-primary border-2"
                  : "hover:bg-surface hover:border-primary border-2 border-black/10"
              }`}
            >
              <Icon isActive={isActive} size="md" />
              <p
                className={`text-xl font-medium duration-300 ${
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
    </nav>
  );
};
export default LeftSidebar;
