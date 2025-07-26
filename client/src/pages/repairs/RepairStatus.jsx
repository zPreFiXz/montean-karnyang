import CarCard from "@/components/cards/CarCard";
import { Car } from "@/components/icons/Icon";
import React from "react";
import { Link, useLocation } from "react-router";

const RepairStatus = () => {
  const location = useLocation();

  return (
    <div className="w-full h-[246px] bg-primary shadow-primary">
      <p className="pt-[16px] pl-[20px] font-semibold text-[20px] text-surface">
        สถานะการซ่อม
      </p>
      <div className="flex justify-center gap-[17px] mx-[20px] mt-[16px] ]">
        <div
          className={`flex items-center justify-center w-[106px] h-[45px] rounded-[10px] shadow-lg transition-all duration-200 ${
            location.pathname === "/repairs/status/inprogress" ||
            location.pathname === "/status"
              ? "bg-in-progress ring-1 ring-white ring-offset-1 ring-offset-transparent"
              : "bg-surface"
          }`}
        >
          <Link
            to="/repairs/status/inprogress"
            className={`font-medium text-[18px] ${
              location.pathname === "/repairs/status/inprogress" ||
              location.pathname === "/status"
                ? "text-surface"
                : "text-subtle-light"
            }`}
          >
            กำลังซ่อม
          </Link>
        </div>
        <div
          className={`flex items-center justify-center w-[106px] h-[45px] rounded-[10px] shadow-lg transition-all duration-200 ${
            location.pathname === "/repairs/status/completed"
              ? "bg-[#66BB6A] ring-1 ring-white ring-offset-1 ring-offset-transparent"
              : "bg-surface"
          }`}
        >
          <Link
            to="/repairs/status/completed"
            className={`font-medium text-[18px] ${
              location.pathname === "/repairs/status/completed"
                ? "text-surface"
                : "text-subtle-light"
            }`}
          >
            ซ่อมเสร็จสิ้น
          </Link>
        </div>
        <div
          className={`flex items-center justify-center w-[106px] h-[45px] rounded-[10px] shadow-lg transition-all duration-200 ${
            location.pathname === "/repairs/status/paid"
              ? "bg-[#1976D2] ring-1 ring-white ring-offset-1 ring-offset-transparent"
              : "bg-surface"
          }`}
        >
          <Link
            to="/repairs/status/paid"
            className={`font-medium text-[18px] ${
              location.pathname === "/repairs/status/paid"
                ? "text-surface"
                : "text-subtle-light"
            }`}
          >
            ชำระเงินแล้ว
          </Link>
        </div>
      </div>
      <div className="w-full h-full mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <p className="pt-[20px] pl-[20px] font-semibold text-[20px] text-normal">
          รายการกำลังซ่อม
        </p>

        <div className="w-[335px] h-[80px] rounded-[10px] mx-auto mt-[16px] bg-white shadow-primary">
          <CarCard
            bg="in-progress"
            color="#F4B809"
            icon={Car}
            plateId={"ขก1799 อุบลราชธานี"}
            band={"Honda Jazz"}
            time={"15:23"}
            price={4300}
          />
        </div>
        <div className="w-[335px] h-[80px] rounded-[10px] mx-auto mt-[16px] bg-white shadow-primary">
          <CarCard
            bg="in-progress"
            color="#F4B809"
            icon={Car}
            plateId={"กง4864 ศรีสะเกษ"}
            band={"Honda Jazz"}
            time={"15:45"}
            price={1100}
          />
        </div>
      </div>
    </div>
  );
};

export default RepairStatus;
