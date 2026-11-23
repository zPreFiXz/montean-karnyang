import { formatCurrency } from "@/utils/formats";
import { ChevronRight } from "lucide-react";

const CarCard = ({
  bg,
  icon,
  licensePlate,
  brand,
  date,
  time,
  // ข้อความต่อท้ายแบบไม่มีหน่วยเวลา เช่น ชื่อลูกค้าที่ตรงกับคำค้น
  note,
  // ต่อท้าย note แต่ไม่ถูกตัด เช่น "และอีก 2 รายการ"
  noteSuffix,
  // ถึงหรือเกินกำหนดชำระ ขึ้นเป็นป้ายแดงแทนป้ายเดิม ป้ายไม่ถูกตัด จอแคบก็ยังเห็น (ดู dueNoteOf)
  dueNote,
  price,
  amount,
  status,
  // ป้ายหน้าบรรทัดรอง เช่น บิลที่เปิดผิดประเภท
  badge,
  // primary = ข้อมูลทั่วไป (เช่นรับมัดจำ) ค่าเริ่มต้นสีแดงไว้เตือน
  badgeTone = "destructive",
  // ป้ายขึ้นบรรทัดของตัวเองใต้ทะเบียน การ์ดสูงขึ้นแทนการตัดข้อความ (คอลัมน์แคบในหน้าหลักจอคอม)
  stackBadge = false,
}) => {
  const shownBadge = dueNote || badge;
  const shownBadgeTone = dueNote ? "destructive" : badgeTone;
  const isStacked = stackBadge && !!shownBadge;
  const badgeEl = shownBadge && (
    <span
      className={`shrink-0 rounded-full px-2 py-px text-sm font-semibold whitespace-nowrap md:text-base ${
        isStacked ? "self-start" : "mr-1.5"
      } ${
        shownBadgeTone === "primary"
          ? "bg-primary/10 text-primary"
          : "bg-destructive/10 text-destructive"
      }`}
    >
      {shownBadge}
    </span>
  );

  const bgColorMap = {
    primary: "bg-primary",
    estimate: "bg-status-estimate",
    progress: "bg-status-progress",
    completed: "bg-status-completed",
    paid: "bg-status-paid",
    credit: "bg-status-credit",
    cancelled: "bg-destructive",
  };

  const textColorMap = {
    primary: "text-primary",
    estimate: "text-status-estimate",
    progress: "text-status-progress",
    completed: "text-status-completed",
    paid: "text-status-paid",
    credit: "text-status-credit",
    cancelled: "text-destructive",
  };

  return (
    <div
      className={`bg-surface shadow-primary flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 ${
        isStacked ? "min-h-20 py-2" : "h-20"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
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
            {isStacked && badgeEl}
            {/* อยู่บรรทัดล่าง ทะเบียนบนหัวการ์ดจะได้ไม่ถูกตัด ป้ายไม่หด ข้อความหลังป้ายโดนตัดแทน */}
            <p className="text-subtle-dark flex min-w-0 items-center text-base font-medium md:text-lg">
              {!isStacked && badgeEl}
              <span className="min-w-0 truncate">
                {brand}
                {date && (
                  <span className="text-subtle-dark">
                    <span className="text-subtle-light"> | </span>
                    <span>{date}</span>
                  </span>
                )}
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
              </span>
              {noteSuffix && (
                <span className="text-subtle-dark shrink-0 whitespace-nowrap">
                  &nbsp;{noteSuffix}
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
          <div className="text-subtle-light flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <ChevronRight />
          </div>
        )}
      </div>
    </div>
  );
};
export default CarCard;
