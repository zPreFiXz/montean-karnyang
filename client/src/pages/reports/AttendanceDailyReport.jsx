import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, LoaderCircle } from "lucide-react";
import SearchBar from "@/components/forms/SearchBar";
import { getDailyAttendanceSummary } from "@/api/attendance";
import { formatTime } from "@/utils/formats";

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

const AttendanceDailyReport = () => {
  const [dateKey, setDateKey] = useState(getTodayDateKey());
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);

  const fetchSummary = async (targetDate) => {
    setIsLoading(true);
    try {
      const res = await getDailyAttendanceSummary(targetDate);
      setSummaryData(res.data);
    } catch (error) {
      console.log(error);
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

  const filteredSummary = useMemo(() => {
    const items = summaryData?.summary || [];
    const query = searchTerm.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) => {
      return (
        item.fullName?.toLowerCase().includes(query) ||
        item.nickname?.toLowerCase().includes(query) ||
        item.zkUserId?.toLowerCase().includes(query)
      );
    });
  }, [summaryData, searchTerm]);

  return (
    <div className="bg-gradient-primary shadow-primary h-[87px] w-full">
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
        <Link to="/dashboard" className="text-surface mt-[2px]">
          <ChevronLeft />
        </Link>
        <p className="text-surface text-[24px] font-semibold md:text-[26px]">
          รายงานสแกนรายวัน
        </p>
      </div>

      <div className="bg-surface shadow-primary mt-[16px] min-h-[calc(100vh-65px)] w-full rounded-tl-2xl rounded-tr-2xl pb-[112px] xl:pb-[16px]">
        {isLoading ? (
          <div className="flex h-[502px] items-center justify-center">
            <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="px-[20px] py-[16px] pb-[112px]">
            <div className="mb-[12px] flex flex-wrap items-center gap-[8px]">
              <Link
                to="/admin/reports/sales"
                className="text-primary border-primary rounded-[10px] border px-[12px] py-[8px] text-[14px] font-semibold"
              >
                รายงานยอดขาย
              </Link>
              <Link
                to="/admin/reports/attendance"
                className="bg-primary text-surface rounded-[10px] px-[12px] py-[8px] text-[14px] font-semibold"
              >
                รายงานสแกนรายวัน
              </Link>
            </div>

            <div className="mb-[12px] grid gap-[12px] md:grid-cols-2">
              <div className="w-full">
                <SearchBar
                  placeholder="ค้นหาชื่อ/รหัสพนักงาน"
                  value={searchTerm}
                  onSearch={setSearchTerm}
                />
              </div>

              <div className="flex items-end">
                <div className="w-full">
                  <p className="text-subtle-dark mb-[8px] text-[18px] font-medium md:text-[20px]">
                    วันที่
                  </p>
                  <input
                    type="date"
                    value={dateKey}
                    onChange={handleDateChange}
                    className="border-input bg-surface h-[41px] w-full rounded-[20px] border px-[12px] text-[18px] font-medium md:text-[20px]"
                  />
                </div>
              </div>
            </div>

            <div className="mb-[12px] grid gap-[8px] md:grid-cols-3">
              <div className="bg-surface shadow-primary rounded-[10px] p-[12px]">
                <p className="text-subtle-dark text-[14px]">พนักงานทั้งหมด</p>
                <p className="text-primary text-[22px] font-semibold">
                  {summaryData?.totalEmployees || 0}
                </p>
              </div>
              <div className="bg-surface shadow-primary rounded-[10px] p-[12px]">
                <p className="text-subtle-dark text-[14px]">สแกนครบ 4 ครั้ง</p>
                <p className="text-primary text-[22px] font-semibold">
                  {summaryData?.completeEmployees || 0}
                </p>
              </div>
              <div className="bg-surface shadow-primary rounded-[10px] p-[12px]">
                <p className="text-subtle-dark text-[14px]">
                  สแกนไม่ผูกพนักงาน
                </p>
                <p className="text-primary text-[22px] font-semibold">
                  {summaryData?.unknownScanCount || 0}
                </p>
              </div>
            </div>

            <div className="space-y-[12px]">
              {filteredSummary.map((item) => (
                <div
                  key={item.employeeId}
                  className="bg-surface shadow-primary rounded-[10px] p-[12px]"
                >
                  <div className="mb-[10px] flex flex-wrap items-center justify-between gap-[8px] border-b border-gray-100 pb-[10px]">
                    <div className="min-w-0 flex-1">
                      <p className="text-normal truncate text-[18px] font-semibold md:text-[20px]">
                        {item.fullName}
                        <span className="text-subtle-dark ml-[6px] text-[14px] font-medium">
                          ({item.zkUserId})
                        </span>
                      </p>
                    </div>
                    <div
                      className={`rounded-[999px] px-[10px] py-[4px] text-[13px] font-semibold ${
                        item.completed
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {item.completed
                        ? "ครบ 4/4"
                        : `${item.scanCount}/${item.requiredScans}`}
                    </div>
                  </div>

                  <div className="grid gap-[8px] md:grid-cols-2">
                    {SLOT_CONFIG.map((slot) => {
                      const slotData = item.slots?.[slot.key];
                      return (
                        <div
                          key={slot.key}
                          className="rounded-[8px] bg-gray-50 px-[10px] py-[8px]"
                        >
                          <p className="text-subtle-dark text-[14px]">
                            {slot.label}
                          </p>
                          {slotData ? (
                            <>
                              <p className="text-normal text-[16px] font-medium">
                                {formatTime(slotData.scanTime)} น.
                              </p>
                              <p className="text-subtle-dark text-[13px]">
                                {slotData.status}
                              </p>
                            </>
                          ) : (
                            <p className="text-destructive text-[16px] font-medium">
                              ยังไม่สแกน
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {!filteredSummary.length && (
                <div className="py-[24px] text-center">
                  <p className="text-subtle-light">ไม่พบข้อมูลพนักงาน</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceDailyReport;
