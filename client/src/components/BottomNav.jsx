import { Link, useLocation } from "react-router";
import { Plus } from "./icons/Icons";
import { MENU_ITEMS, isActivePath } from "@/constants/menu";

const NavButton = ({ icon: Icon, label, to, isActive }) => (
  <Link to={to} aria-label={label} aria-current={isActive ? "page" : undefined}>
    <div className="flex flex-col items-center">
      <div
        className={`flex h-[38px] w-[38px] items-center justify-center rounded-[8px] ${
          isActive ? "bg-gradient-primary" : "border-subtle-light border-2"
        }`}
      >
        <Icon color={isActive ? "white" : "#afb1b6"} size="sm" />
      </div>
      <p
        className={`text-sm leading-tight font-semibold md:text-base ${
          isActive ? "text-primary" : "text-subtle-light"
        }`}
      >
        {label}
      </p>
    </div>
  </Link>
);

// แถบนำทางล่างสำหรับจอมือถือ/แท็บเล็ต
const BottomNav = () => {
  const location = useLocation();
  const [home, inspection, vehicles, inventory] = MENU_ITEMS;

  const renderItem = (item) => (
    <NavButton
      key={item.path}
      icon={item.icon}
      label={item.shortLabel}
      to={item.path}
      isActive={isActivePath(item.path, location.pathname)}
    />
  );

  return (
    <nav className="px-5 pb-6">
      <div className="bg-surface shadow-tab flex h-[72px] w-full items-center justify-between rounded-2xl pr-4 pl-5 md:justify-around">
        {renderItem(home)}
        {renderItem(inspection)}

        {/* รายการซ่อมใหม่ */}
        <Link to="/repairs/new" aria-label="รายการซ่อมใหม่">
          <div className="bg-gradient-primary flex h-[45px] w-[75px] items-center justify-center rounded-2xl">
            <Plus size="md" />
          </div>
        </Link>

        {renderItem(vehicles)}
        {renderItem(inventory)}
      </div>
    </nav>
  );
};
export default BottomNav;
