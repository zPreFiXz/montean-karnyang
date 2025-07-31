import { Link, useLocation } from "react-router";
import {
  BoxSearch,
  CarRepair,
  DashboardBar,
  Document,
  Plus,
} from "./icons/Icon";

// Tab Button Component
const TabButton = ({ icon: Icon, label, to, iconProps = {} }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  const buttonContent = (
    <div className="flex flex-col items-center">
      <div
        className={`flex justify-center items-center w-[35px] h-[35px] rounded-[5px] ${
          isActive ? "bg-gradient-primary" : "border-2 border-subtle-light"
        }`}
      >
        <Icon color={isActive ? "white" : "#afb1b6"} size="sm" {...iconProps} />
      </div>
      <p
        className={`text-[12px] font-semibold leading-tight ${
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
    <div className="flex justify-between md:justify-around items-center w-full h-[60px] pl-[20px] pr-[15px] md:px-auto rounded-tl-2xl rounded-tr-2xl bg-surface shadow-tab">
      {/* Dashboard Button */}
      <TabButton icon={DashboardBar} label="แดชบอร์ด" to="/dashboard" />

      {/* Check Suspension Button */}
      <TabButton
        icon={CarRepair}
        label="เช็คช่วงล่าง"
        to="/inspections/suspension"
      />

      {/* New Repair Button */}
      <div className="flex justify-center items-center w-[75px] h-[45px] rounded-2xl bg-gradient-primary">
        <Link to="/repairs/new">
          <Plus size="md" />
        </Link>
      </div>

      {/* Customer History Button */}
      <TabButton
        icon={Document}
        label="ประวัติลูกค้า"
        to="/customers"
      />

      {/* Inventory Overview Button */}
      <TabButton icon={BoxSearch} label="สต็อกอะไหล่" to="/inventory" />
    </div>
  );
};
export default Tab;
