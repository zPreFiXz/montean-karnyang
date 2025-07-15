import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CarCard from "@/components/cards/CarCard";
import { Car } from "@/components/icons/Icon";
import { Link, useLocation } from "react-router";

const SalesReport = () => {
  const location = useLocation();

  return (
    <div className="lg:hidden">
      <div className="w-full h-[265px] pt-[16px] px-[20px] bg-gradient-primary">
        <p className="font-semibold text-[22px] text-surface">ยอดขาย</p>
        <div className="flex justify-center gap-[17px] mt-[16px] ]">
          <Link
            to="/sales/daily"
            className="flex items-center justify-center w-[78px] h-[30px] rounded-[10px] bg-surface shadow-primary cursor-pointer hover:bg-surface/90 transition-colors"
          >
            <p
              className={`font-semibold text-[18px] ${
                location.pathname === "/sales/daily"
                  ? "text-primary"
                  : "text-subtle-light"
              }`}
            >
              วัน
            </p>
          </Link>
          <Link
            to="/sales/weekly"
            className="flex items-center justify-center w-[78px] h-[30px] rounded-[10px] bg-surface shadow-primary cursor-pointer hover:bg-surface/90 transition-colors"
          >
            <p
              className={`font-semibold text-[18px] ${
                location.pathname === "/sales/weekly"
                  ? "text-primary"
                  : "text-subtle-light"
              }`}
            >
              สัปดาห์
            </p>
          </Link>
          <Link
            to="/sales/monthly"
            className="flex items-center justify-center w-[78px] h-[30px] rounded-[10px] bg-surface shadow-primary cursor-pointer hover:bg-surface/90 transition-colors"
          >
            <p
              className={`font-semibold text-[18px] ${
                location.pathname === "/sales/monthly"
                  ? "text-primary"
                  : "text-subtle-light"
              }`}
            >
              เดือน
            </p>
          </Link>
          <Link
            to="/sales/yearly"
            className="flex items-center justify-center w-[78px] h-[30px] rounded-[10px] bg-surface shadow-primary cursor-pointer hover:bg-surface/90 transition-colors"
          >
            <p
              className={`font-semibold text-[18px] ${
                location.pathname === "/sales/yearly"
                  ? "text-primary"
                  : "text-subtle-light"
              }`}
            >
              ปี
            </p>
          </Link>
        </div>
        <div className="flex items-center justify-center">
          <p className="pt-[16px] font-semibold text-[18px] text-surface">
            1 มีนาคม 2568
          </p>
        </div>
        <div className="flex items-center justify-between w-full mt-[16px] px-[20px]">
          <div className="flex items-center justify-center w-[32px] h-[32px] rounded-full bg-surface">
            <ChevronLeft
              className="w-[20px] h-[20px] text-primary"
              strokeWidth={2.5}
            />
          </div>
          <div className="flex flex-col items-center">
            <p className="font-semibold text-[32px] text-surface">5,400 บาท</p>
          </div>
          <div className="flex items-center justify-center w-[32px] h-[32px] rounded-full bg-surface">
            <ChevronRight
              className="w-[20px] h-[20px] text-primary"
              strokeWidth={2.5}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col w-full min-h-[calc(100vh-201px)] gap-[16px] px-[20px] -mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface">
        <p className="pt-[16px] font-semibold text-[22px] text-normal">
          รายการซ่อม
        </p>
        <CarCard
          bg="primary"
          color="#5B46F4"
          icon={Car}
          plateId={"ขก1799 อุบลราชธานี"}
          band={"Honda Jazz"}
          time={"15:23"}
          price={4300}
        />
      </div>
    </div>
  );
};

export default SalesReport;
