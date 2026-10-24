import { ChevronRight } from "lucide-react";
import { formatCurrency } from "@/utils/formats";
import { getStatusInfo } from "@/constants/repairStatus";

const RepairCard = ({
  icon: Icon,
  itemCount,
  customerName,
  dateText,
  price,
  status,
}) => {
  // บิลที่ยกเลิกขีดฆ่ายอด ไม่ได้นับเป็นเงินเข้า
  const info = getStatusInfo(status);
  const style = {
    bg: info.bg,
    text: status === "CANCELLED" ? `${info.color} line-through` : info.color,
  };

  const details = [
    itemCount ? `${itemCount} รายการ` : null,
    customerName || null,
  ].filter(Boolean);

  return (
    <div className="bg-surface shadow-primary flex h-20 w-full items-center justify-between gap-2 rounded-lg px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div
          className={`flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-full ${style.bg}`}
        >
          <Icon color="white" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <p
            className={`truncate text-lg leading-tight font-semibold md:text-xl ${style.text}`}
          >
            {dateText}
          </p>
          <p className="text-subtle-dark truncate text-base leading-tight font-medium md:text-lg">
            {details.join(" · ")}
          </p>
        </div>
      </div>

      {price ? (
        <p
          className={`shrink-0 text-[22px] font-semibold md:text-2xl ${style.text}`}
        >
          {formatCurrency(price)}
        </p>
      ) : (
        <div className="text-subtle-light flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F6F6F6]">
          <ChevronRight />
        </div>
      )}
    </div>
  );
};
export default RepairCard;
