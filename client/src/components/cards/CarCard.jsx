import { formatCurrency } from "@/utils/formats";
import { ChevronRight } from "lucide-react";

const CarCard = ({
  bg,
  icon,
  licensePlate,
  brand,
  time,
  // ข้อความต่อท้ายแบบไม่มีหน่วยเวลา เช่น ชื่อลูกค้าที่ตรงกับคำค้น
  note,
  price,
  amount,
  status,
}) => {
  const bgColorMap = {
    primary: "bg-primary",
    progress: "bg-status-progress",
    completed: "bg-status-completed",
    paid: "bg-status-paid",
  };

  const textColorMap = {
    primary: "text-primary",
    progress: "text-status-progress",
    completed: "text-status-completed",
    paid: "text-status-paid",
  };

  return (
    <div className="bg-surface shadow-primary flex h-[80px] w-full cursor-pointer items-center gap-[8px] rounded-[10px] px-[8px]">
      <div className="flex min-w-0 flex-1 items-center gap-[8px]">
        <div
          className={`flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-full ${bgColorMap[bg]}`}
        >
          {typeof icon === "function" ? icon() : icon}
        </div>

        {licensePlate ? (
          <div className="flex min-w-0 flex-1 flex-col">
            <p
              className={`truncate text-lg font-semibold md:text-xl ${textColorMap[bg]}`}
            >
              {licensePlate}
            </p>
            <p className="text-subtle-dark truncate text-base font-medium md:text-lg">
              {brand}
              {time && (
                <span className="text-subtle-dark">
                  <span className="text-subtle-light"> | </span>
                  <span>{time} น.</span>
                </span>
              )}
              {note && (
                <span className="text-subtle-dark">
                  <span className="text-subtle-light"> | </span>
                  <span>{note}</span>
                </span>
              )}
            </p>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col">
            <p
              className={`truncate text-xl font-semibold md:text-[22px] ${textColorMap[bg]}`}
            >
              {status}
            </p>
          </div>
        )}
      </div>

      <div
        className={`shrink-0 font-semibold ${
          price ? "text-[22px] md:text-2xl" : "text-[32px] md:text-[34px]"
        } ${textColorMap[bg]}`}
      >
        {price ? (
          formatCurrency(price)
        ) : amount ? (
          `${amount} คัน`
        ) : (
          <div className="text-subtle-light flex h-[32px] w-[32px] items-center justify-center rounded-full bg-gray-100">
            <ChevronRight />
          </div>
        )}
      </div>
    </div>
  );
};
export default CarCard;
