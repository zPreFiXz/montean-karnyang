import { Link, useLocation } from "react-router";
import { Plus } from "@/components/icons/Icons";
import { MENU_ITEMS, isActivePath } from "@/constants/menu";
import { useResetCurrentPage } from "@/hooks/usePageReset";

// แถวเมนูชิดซ้ายแบบระบบงานบนคอม เมนูที่เลือกเป็นพื้นฟ้าอ่อน ไม่ใช้กรอบรอบทุกเมนู
const Sidebar = () => {
  const location = useLocation();
  const resetCurrentPage = useResetCurrentPage();

  return (
    <nav className="shadow-primary hidden min-h-[calc(100vh-73px)] w-64 flex-col gap-1 px-4 pt-6 xl:flex">
      <Link
        to="/repairs/new"
        className="bg-gradient-primary mb-5 flex h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-lg shadow-sm duration-300 hover:opacity-90"
      >
        <Plus size="sm" />
        <p className="text-surface text-xl font-semibold">งานซ่อมใหม่</p>
      </Link>

      {MENU_ITEMS.map((item) => {
        const isActive = isActivePath(item.path, location.pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path}
            aria-current={isActive ? "page" : undefined}
            onClick={(e) => {
              if (location.pathname !== item.path) return;
              e.preventDefault();
              resetCurrentPage(item.path);
            }}
            className={`group flex h-13 w-full items-center gap-3 rounded-lg px-3 duration-200 ${
              isActive ? "bg-primary/10" : "hover:bg-primary/5"
            }`}
          >
            <Icon isActive={isActive} size="sm" />
            <p
              className={`text-xl duration-200 ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-subtle-dark group-hover:text-primary font-medium"
              }`}
            >
              {item.label}
            </p>
          </Link>
        );
      })}
    </nav>
  );
};
export default Sidebar;
