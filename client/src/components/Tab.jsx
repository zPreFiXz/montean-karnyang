import { Link, useLocation } from "react-router";
import {
  BoxSearch,
  CarRepair,
  DashboardBar,
  Document,
  Plus,
} from "./icons/Icon";

const TabButton = ({ icon: Icon, label, to, iconProps = {} }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  const buttonContent = (
    <div className="flex flex-col items-center">
      <div
        className={`flex justify-center items-center w-[38px] h-[38px] rounded-[5px] ${
          isActive ? "bg-gradient-primary" : "border-2 border-subtle-light"
        }`}
      >
        <Icon color={isActive ? "white" : "#afb1b6"} size="sm" {...iconProps} />
      </div>
      <p
        className={`text-[14px] md:text-[16px] font-semibold leading-tight ${
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
      <div className="flex justify-between md:justify-around items-center w-full h-[72px] pl-[20px] pr-[15px] md:px-auto rounded-2xl bg-surface shadow-tab">
        {/* ปุ่มหน้าหลัก */}
        <TabButton icon={DashboardBar} label="หน้าหลัก" to="/dashboard" />

        {/* ปุ่มเช็กช่วงล่าง */}
        <TabButton
          icon={CarRepair}
          label="เช็กช่วงล่าง"
          to="/inspections/suspension"
        />

        {/* ปุ่มสร้างรายการซ่อมใหม่ */}
        <Link to="/repair/new">
          <div className="flex justify-center items-center w-[75px] h-[45px] rounded-2xl bg-gradient-primary">
            <Plus size="md" />
          </div>
        </Link>

        {/* ปุ่มประวัติลูกค้า */}
        <TabButton icon={Document} label="ประวัติลูกค้า" to="/vehicles" />

        {/* ปุ่มอะไหล่และบริการ */}
        <TabButton icon={BoxSearch} label="อะไหล่" to="/inventory" />
      </div>
    </div>
  );
};
export default Tab;
