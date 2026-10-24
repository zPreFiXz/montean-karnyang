import { useState } from "react";
import { Link } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { CalendarMonth } from "@/components/ui/CalendarMonth";
import { CalendarYear } from "@/components/ui/CalendarYear";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PERIOD_TYPES, getDisplayDate, shiftDate } from "@/utils/reportPeriod";

// children คือตัวเลขใหญ่กลางหัว (ยอดเงินของช่วงที่เลือก)
const ReportPeriodHeader = ({
  title,
  basePath,
  periodType,
  currentDate,
  onDateChange,
  onBack,
  children,
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleDateSelect = (date) => {
    if (!date) return;
    onDateChange(date);
    setIsCalendarOpen(false);
  };

  const calendarProps = {
    mode: "single",
    defaultMonth: currentDate,
    selected: currentDate,
    onSelect: handleDateSelect,
    initialFocus: true,
    captionLayout: "dropdown",
    fromYear: 2025,
    toYear: 2035,
    className: "rounded-md shadow-sm",
    autoFocus: false,
  };

  return (
    <div className="bg-gradient-primary h-[265px] w-full px-5 py-4 md:h-[285px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            aria-label="ย้อนกลับ"
            className="bg-surface/20 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
          >
            <ChevronLeft className="text-surface" />
          </button>
          <p className="text-surface text-2xl font-semibold md:text-[26px]">
            {title}
          </p>
        </div>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <button className="text-surface flex cursor-pointer items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              <p className="text-xl font-semibold md:text-[22px]">
                {PERIOD_TYPES.find((type) => type.id === periodType)?.pickLabel}
              </p>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0"
            align="end"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {periodType === "monthly" ? (
              <CalendarMonth {...calendarProps} monthFormat="long" />
            ) : periodType === "yearly" ? (
              <CalendarYear {...calendarProps} />
            ) : (
              <Calendar {...calendarProps} monthFormat="long" />
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div className="mt-4 flex justify-center gap-4">
        {PERIOD_TYPES.map((type) => (
          <Link
            key={type.id}
            to={`${basePath}${basePath.includes("?") ? "&" : "?"}period=${type.id}`}
            state={{ currentDate: new Date().toISOString() }}
            // แทนที่หน้าเดิม กดย้อนกลับครั้งเดียวก็ออกจากหน้ารายงาน
            replace
            className={`flex h-[35px] w-19.5 items-center justify-center rounded-lg border-2 text-lg font-semibold md:h-10 md:w-[95px] md:text-xl ${
              periodType === type.id
                ? "text-surface bg-primary border-white"
                : "border-subtle-light text-subtle-light bg-surface"
            }`}
          >
            {type.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-center pt-4">
        <div className="text-surface text-[22px] font-semibold md:text-2xl">
          {getDisplayDate(currentDate, periodType)}
        </div>
      </div>

      <div className="mt-4 flex w-full items-center justify-between px-5">
        <button
          onClick={() =>
            onDateChange(shiftDate(currentDate, periodType, "prev"))
          }
          aria-label="ช่วงก่อนหน้า"
          className="bg-surface flex h-11 w-11 cursor-pointer items-center justify-center rounded-full md:h-12 md:w-12"
        >
          <ChevronLeft
            className="text-primary mr-0.5 h-6 w-6 md:h-6.5 md:w-6.5"
            strokeWidth={2.5}
          />
        </button>
        <div className="flex flex-col items-center">{children}</div>
        <button
          onClick={() =>
            onDateChange(shiftDate(currentDate, periodType, "next"))
          }
          aria-label="ช่วงถัดไป"
          className="bg-surface flex h-11 w-11 cursor-pointer items-center justify-center rounded-full md:h-12 md:w-12"
        >
          <ChevronRight
            className="text-primary ml-0.5 h-6 w-6 md:h-6.5 md:w-6.5"
            strokeWidth={2.5}
          />
        </button>
      </div>
    </div>
  );
};

export default ReportPeriodHeader;
