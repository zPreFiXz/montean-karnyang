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
    <div className="flex justify-between items-center w-full h-[80px] gap-[8px] px-[10px] rounded-[10px] bg-surface shadow-primary">
      <div className="flex-1 flex items-center gap-[8px]">
        <div
          className={`flex justify-center items-center w-[45px] h-[45px] rounded-full ${bgColorMap[bg]}`}
        >
          <Icon color={color} />
        </div>
        {licensePlate ? (
          <div className="flex-1 flex flex-col">
            <p
              className={`font-semibold text-[18px] md:text-[20px] ${textColorMap[bg]} line-clamp-1`}
            >
              {licensePlate}
            </p>
            <p className="font-medium text-[16px] md:text-[18px] text-subtle-dark line-clamp-1">
              {[brand, time && `${time} น.`].filter(Boolean).join(" | ") || ""}
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <p
              className={`font-semibold text-[20px] md:text-[22px] ${textColorMap[bg]} line-clamp-1`}
            >
              {status}
            </p>
          </div>
        )}
      </div>
      <div
        className={`font-semibold ${
          price
            ? "text-[22px] md:text-[24px] text-nowrap"
            : "text-[32px] md:text-[34px]"
        } ${textColorMap[bg]}`}
      >
        {price ? (
          formatCurrency(price)
        ) : amount ? (
          `${amount} คัน`
        ) : (
          <div className="flex justify-center items-center w-[32px] h-[32px] rounded-full text-subtle-light bg-[#F6F6F6]">
            <ChevronRight />
          </div>
        )}
      </div>
    </div>
  );
};
export default CarCard;
