import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, LoaderCircle } from "lucide-react";
import FormInput from "@/components/forms/FormInput";
import { getAttendanceSummary } from "@/api/attendance";
import { formatTime } from "@/utils/formats";
import { toastError } from "@/utils/handleError";

const SLOT_CONFIG = [
  { key: "inWork", label: "เข้างาน" },
  { key: "lunchOut", label: "พักเที่ยง" },
  { key: "lunchIn", label: "กลับจากพักเที่ยง" },
  { key: "offWork", label: "เลิกงาน" },
];

const getTodayDateKey = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const AttendanceReport = () => {
  const [dateKey, setDateKey] = useState(getTodayDateKey());
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);

  const fetchSummary = async (targetDate) => {
    setIsLoading(true);
    try {
      const res = await getAttendanceSummary(targetDate);
      setSummaryData(res.data);
    } catch (error) {
      toastError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchSummary(dateKey);
  }, []);

  const handleDateChange = async (event) => {
    const newDate = event.target.value;
    setDateKey(newDate);
    await fetchSummary(newDate);
  };

  const summaryItems = summaryData?.summary || [];

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-4">
        <Link
          to="/dashboard"
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </Link>
        <p className="text-surface text-2xl font-semibold md:text-[26px]">
          รายงานเวลาเข้า-ออกงาน
        </p>
      </div>

      <div className="bg-surface shadow-primary mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl pb-28 xl:pb-4">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-1 flex-col px-5 pt-4">
            <FormInput
              name="date"
              label="วันที่"
              type="date"
              color="subtle-dark"
              errors={{}}
              value={dateKey}
              onChange={handleDateChange}
              customClass="mb-4"
            />

            <p className="text-subtle-dark mb-4 text-lg font-semibold md:text-xl">
              พนักงานทั้งหมด {summaryData?.totalEmployees || 0} คน
            </p>

            <div className="flex flex-1 flex-col gap-4">
              {summaryItems.map((item) => (
                <div
                  key={item.employeeId}
                  className="bg-surface shadow-primary rounded-lg p-4"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-normal truncate text-lg font-semibold md:text-xl">
                        {item.name}
                        <span className="text-subtle-dark ml-1.5 text-sm font-medium">
                          ({item.zkUserId})
                        </span>
                      </p>
                    </div>
                    <div
                      className={`text-surface rounded-[999px] px-3 py-1 text-sm font-semibold ${
                        item.completed
                          ? "bg-status-completed"
                          : "bg-status-progress"
                      }`}
                    >
                      {item.completed
                        ? "ครบ 4/4"
                        : `${item.scanCount}/${item.requiredScans}`}
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    {SLOT_CONFIG.map((slot) => {
                      const slotData = item.slots?.[slot.key];
                      return (
                        <div
                          key={slot.key}
                          className="rounded-md bg-gray-50 p-2"
                        >
                          <p className="text-subtle-dark text-sm">
                            {slot.label}
                          </p>
                          {slotData ? (
                            <>
                              <p className="text-normal text-base font-medium">
                                {formatTime(slotData.scannedAt)} น.
                              </p>
                              <p className="text-subtle-dark text-sm">
                                {slotData.status}
                              </p>
                            </>
                          ) : (
                            <p className="text-destructive text-base font-medium">
                              ยังไม่สแกน
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {!summaryItems.length && (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-subtle-light text-center text-xl text-balance md:text-[22px]">
                    ไม่มีพนักงาน
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceReport;
