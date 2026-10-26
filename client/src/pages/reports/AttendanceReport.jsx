import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import PageSpinner from "@/components/ui/PageSpinner";
import ReportPeriodHeader from "@/components/reports/ReportPeriodHeader";
import { getAttendanceSummary } from "@/api/attendance";
import { formatTime } from "@/utils/formats";
import { toastError } from "@/utils/handleError";

const SLOT_CONFIG = [
  { key: "inWork", label: "เข้างาน" },
  { key: "lunchOut", label: "พักเที่ยง" },
  { key: "lunchIn", label: "กลับจากพักเที่ยง" },
  { key: "offWork", label: "เลิกงาน" },
];

const toDateKey = (date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

// หัวช่องบอกชื่อช่วงอยู่แล้ว เหลือแค่ส่วนในวงเล็บ เช่น "สาย 5 นาที"
const statusDetail = (status) => status?.match(/\(([^)]+)\)\s*$/)?.[1] || "";

const scanBadgeClass = (item) => {
  if (item.completed) return "bg-status-completed text-surface";
  if (item.missingSlots.length < item.requiredScans)
    return "bg-status-progress text-surface";
  return "bg-gray-100 text-subtle-dark";
};

const AttendanceReport = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getAttendanceSummary(toDateKey(currentDate))
      .then((res) => {
        if (!cancelled) setSummaryData(res.data);
      })
      .catch((error) => {
        if (!cancelled) toastError(error);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentDate]);

  const summaryItems = summaryData?.summary || [];
  const totalEmployees = summaryData?.totalEmployees || 0;
  const completedCount = summaryItems.filter((item) => item.completed).length;

  return (
    <div className="flex min-h-svh flex-col">
      <ReportPeriodHeader
        title="รายงานเวลาเข้า-ออกงาน"
        periodType="daily"
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onBack={() => navigate("/dashboard")}
        showPeriodTabs={false}
      >
        <p className="text-surface/80 text-lg md:text-xl">สแกนครบ</p>
        <p className="text-surface text-[32px] leading-tight font-semibold md:text-[34px]">
          {isLoading ? "-" : `${completedCount}/${totalEmployees} คน`}
        </p>
      </ReportPeriodHeader>

      <div className="bg-surface -mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl px-5 pb-28 xl:pb-4">
        {isLoading ? (
          <PageSpinner />
        ) : summaryItems.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-subtle-light text-center text-xl text-balance md:text-[22px]">
              ไม่มีพนักงาน
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-4">
            {summaryItems.map((item) => (
              <div
                key={item.employeeId}
                className="bg-surface shadow-primary rounded-lg p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-normal min-w-0 truncate text-xl font-semibold md:text-[22px]">
                    {item.name}
                    <span className="text-subtle-dark ml-1.5 text-lg font-medium md:text-xl">
                      รหัส {item.zkUserId}
                    </span>
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-3 py-0.5 text-lg font-semibold md:text-xl ${scanBadgeClass(item)}`}
                  >
                    {`${item.requiredScans - item.missingSlots.length}/${item.requiredScans}`}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                  {SLOT_CONFIG.map((slot) => {
                    const slotData = item.slots?.[slot.key];
                    const detail = statusDetail(slotData?.status);
                    return (
                      <div key={slot.key} className="rounded-lg bg-gray-50 p-3">
                        <p className="text-subtle-dark truncate text-base md:text-lg">
                          {slot.label}
                        </p>
                        {slotData ? (
                          <p className="text-normal text-xl font-semibold md:text-[22px]">
                            {formatTime(slotData.scannedAt)} น.
                          </p>
                        ) : (
                          <p className="text-subtle-light text-xl font-semibold md:text-[22px]">
                            --:--
                          </p>
                        )}
                        {detail && (
                          <p
                            className={`truncate text-base font-medium md:text-lg ${
                              slotData.isLate
                                ? "text-destructive"
                                : "text-subtle-dark"
                            }`}
                          >
                            {detail}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceReport;
