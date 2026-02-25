import { Link, useLocation } from "react-router";
import {
  BoxSearch,
  CarRepair,
  DashboardBar,
  Document,
  Plus,
} from "./icons/Icons";

const TabButton = ({ icon: Icon, label, to, iconProps = {} }) => {
  const location = useLocation();

  const isActivePath = () => {
    if (to === "/dashboard") {
      return location.pathname === to;
    }

    if (to === "/vehicles") {
      const isRepairDetail =
        location.pathname.startsWith("/repairs/") &&
        !location.pathname.includes("/new") &&
        !location.pathname.includes("/summary");
      const isRepairStatus = location.pathname === "/repairs";
      return (
        location.pathname === to ||
        location.pathname.startsWith(to + "/") ||
        (isRepairDetail && !isRepairStatus)
      );
    }
    return location.pathname === to || location.pathname.startsWith(to + "/");
  };

  const isActive = isActivePath();

  const buttonContent = (
    <div className="flex flex-col items-center">
      <div
        className={`flex h-[38px] w-[38px] items-center justify-center rounded-[8px] ${
          isActive ? "bg-gradient-primary" : "border-subtle-light border-2"
        }`}
      >
        <Icon color={isActive ? "white" : "#afb1b6"} size="sm" {...iconProps} />
      </div>
      <p
        className={`text-[14px] leading-tight font-semibold md:text-[16px] ${
          isActive ? "text-primary" : "text-subtle-light"
        }`}
      >
        {label}
      </p>
    </div>
  );

  return to ? <Link to={to}>{buttonContent}</Link> : buttonContent;
};

const Tab = () => {
  return (
    <div className="px-[20px] pb-[24px]">
      <div className="md:px-auto bg-surface shadow-tab flex h-[72px] w-full items-center justify-between rounded-2xl pr-[15px] pl-[20px] md:justify-around">
        
        {/* หน้าหลัก */}
        <TabButton icon={DashboardBar} label="หน้าหลัก" to="/dashboard" />

        {/* เช็กช่วงล่าง */}
        <TabButton
          icon={CarRepair}
          label="เช็กช่วงล่าง"
          to="/inspections/suspension"
        />

        {/* รายการซ่อมใหม่ */}
        <Link to="/repairs/new">
          <div className="bg-gradient-primary flex h-[45px] w-[75px] items-center justify-center rounded-2xl">
            <Plus size="md" />
          </div>
        </Link>

        {/* ประวัติลูกค้า */}
        <TabButton icon={Document} label="ประวัติลูกค้า" to="/vehicles" />

        {/* สต็อก */}
        <TabButton icon={BoxSearch} label="สต็อก" to="/inventory" />
      </div>
    </div>
  );
};
export default Tab;
