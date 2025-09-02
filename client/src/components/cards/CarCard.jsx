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
    <div className="flex justify-between items-center w-full h-[80px] gap-[8px] px-[16px] rounded-[10px] bg-surface shadow-primary">
      <div className="flex-1 flex items-center min-w-0 gap-[8px]">
        <div
          className={`flex justify-center items-center w-[45px] h-[45px] rounded-full ${bgColorMap[bg]}`}
        >
          <Icon color={color} />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <p
            className={`font-semibold text-[20px] truncate ${textColorMap[bg]}`}
          >
            {licensePlate}
          </p>
          <p className="font-medium text-[16px] text-subtle-dark truncate">
            {[brand, time && `${time} น.`].filter(Boolean).join(" | ") || ""}
          </p>
        </div>
      </div>
      <div
        className={`font-semibold ${
          price ? "text-[24px] text-nowrap" : "text-[32px]"
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
