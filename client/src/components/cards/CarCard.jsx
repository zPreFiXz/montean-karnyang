import { formatCurrency } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

const CarCard = ({
  bg,
  color,
  icon: Icon,
  licensePlate,
  brand,
  time,
  price,
  amount,
  status,
}) => {
  const bgColorMap = {
    primary: "bg-[var(--color-primary)]",
    "in-progress": "bg-[var(--color-in-progress)]",
    completed: "bg-[var(--color-completed)]",
    paid: "bg-[var(--color-paid)]",
  };

  const textColorMap = {
    primary: "text-[var(--color-primary)]",
    "in-progress": "text-[var(--color-in-progress)]",
    completed: "text-[var(--color-completed)]",
    paid: "text-[var(--color-paid)]",
  };

  return (
    <div className="bg-surface shadow-primary flex h-[80px] w-full items-center gap-[8px] rounded-[10px] px-[10px]">
      <div className="flex min-w-0 flex-1 items-center gap-[8px]">
        <div
          className={`flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-full ${bgColorMap[bg]}`}
        >
          <Icon color={color} />
        </div>
        {/* แสดงป้ายทะเบียนถ้ามี ถ้าไม่มีให้แสดงสถานะ */}
        {licensePlate ? (
          <div className="flex min-w-0 flex-1 flex-col">
            <p
              className={`truncate text-[18px] font-semibold md:text-[20px] ${textColorMap[bg]}`}
            >
              {licensePlate}
            </p>
            <p className="text-subtle-dark truncate text-[14px] font-medium md:text-[16px]">
              {brand}
              {time && (
                <span className="text-subtle-dark">
                  <span className="text-subtle-light"> | </span>
                  <span>{time} น.</span>
                </span>
              )}
            </p>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col">
            <p
              className={`truncate text-[20px] font-semibold md:text-[22px] ${textColorMap[bg]}`}
            >
              {status}
            </p>
          </div>
        )}
      </div>
      <div
        className={`shrink-0 font-semibold ${
          price
            ? "text-[22px] md:text-[24px]"
            : "text-[32px] md:text-[34px]"
        } ${textColorMap[bg]}`}
      >
        {/* แสดงราคาถ้ามี ถ้าไม่มีให้แสดงจำนวนรถยนต์ */}
        {price ? (
          formatCurrency(price)
        ) : amount ? (
          `${amount} คัน`
        ) : (
          <div className="text-subtle-light flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#F6F6F6]">
            <ChevronRight />
          </div>
        )}
      </div>
    </div>
  );
};
export default CarCard;
