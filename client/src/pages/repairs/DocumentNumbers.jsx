import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { Hash, ShoppingBag, Wrench as WrenchOutline } from "lucide-react";
import ReportPeriodHeader from "@/components/reports/ReportPeriodHeader";
import CarCard from "@/components/cards/CarCard";
import BrandIcons from "@/components/icons/BrandIcons";
import OutlineCardIcon from "@/components/icons/OutlineCardIcon";
import PageSpinner from "@/components/ui/PageSpinner";
import { listDocumentNumbers } from "@/api/repair";
import { getStatusInfo } from "@/constants/repairStatus";
import { organizationIcon } from "@/constants/organizations";
import { formatDateWithWeekday } from "@/utils/formats";
import { toLocalDateKey } from "@/utils/date";
import { toastError } from "@/utils/handleError";
import {
  getRepairTitle,
  isNoVehicleRepair,
  isSaleRepair,
} from "@/utils/repairDisplay";
import {
  saveScrollPosition,
  useScrollRestoration,
} from "@/utils/scrollPosition";

const DOC_TYPES = [
  { id: "RE", label: "ใบเสร็จรับเงิน" },
  { id: "DO", label: "ใบส่งของ" },
  { id: "QT", label: "ใบเสนอราคา" },
  { id: "BL", label: "ใบวางบิล" },
];

// ต้องตรงกับ periodOf ใน server/utils/documentNumber.js (ปี พ.ศ. สองหลัก + เดือน)
const periodOf = (date) =>
  `${String((date.getFullYear() + 543) % 100).padStart(2, "0")}${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}`;

const CARD_BG = {
  ESTIMATE: "estimate",
  IN_PROGRESS: "progress",
  COMPLETED: "completed",
  CREDIT: "credit",
  PAID: "paid",
  CANCELLED: "cancelled",
};

// เก็บผลไว้นอกคอมโพเนนต์ กดย้อนกลับมาจะมีรายการตั้งแต่เฟรมแรก
const dataCache = new Map();

const DocumentNumbers = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const prefix = DOC_TYPES.some((type) => type.id === searchParams.get("type"))
    ? searchParams.get("type")
    : "RE";
  const [currentDate, setCurrentDate] = useState(() =>
    location.state?.currentDate
      ? new Date(location.state.currentDate)
      : new Date(),
  );
  // ตัวกรองอยู่ใน URL กดเข้าบิลแล้วย้อนกลับมายังติ๊กไว้เหมือนเดิม
  const onlyProblems = searchParams.get("cancelled") === "1";
  const setOnlyProblems = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("cancelled", "1");
    else next.delete("cancelled");
    setSearchParams(next, { replace: true, state: location.state });
  };
  const period = periodOf(currentDate);
  const requestKey = `${prefix}-${period}`;
  // ย้อนกลับมาจากหน้าบิลแสดงข้อมูลเดิมทันที ไม่ต้องหมุนรอ แล้วค่อยโหลดใหม่เงียบๆ
  const [data, setData] = useState(() => dataCache.get(requestKey) || null);
  const shownData = data?.key === requestKey ? data : dataCache.get(requestKey);
  const isLoading = !shownData;

  useEffect(() => {
    let cancelled = false;
    listDocumentNumbers(prefix, period)
      .then((res) => {
        const next = { key: `${prefix}-${period}`, ...res.data };
        dataCache.set(next.key, next);
        if (!cancelled) setData(next);
      })
      .catch((error) => {
        if (!cancelled)
          toastError(error, "โหลดเลขที่เอกสารไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      });
    return () => {
      cancelled = true;
    };
  }, [prefix, period]);

  const scrollKey = location.pathname + location.search;
  useScrollRestoration(scrollKey, !isLoading);

  const entries = isLoading ? [] : shownData.entries;
  const isCancelled = (entry) => entry.repair?.status === "CANCELLED";
  const cancelledCount = entries.filter(isCancelled).length;
  const missingCount = entries.filter((entry) => entry.missing).length;
  // ใบวางบิลยกเลิกไม่ได้ จึงไม่มีตัวกรอง
  const canFilterCancelled = prefix !== "BL";
  const shown =
    onlyProblems && canFilterCancelled ? entries.filter(isCancelled) : entries;

  const summary = [
    {
      label: "ใช้งาน",
      count: entries.length - cancelledCount - missingCount,
    },
    prefix !== "BL" && { label: "ยกเลิก", count: cancelledCount },
    // ระบบไม่ทำให้เลขขาดช่วง จะเกิดก็ต่อเมื่อแก้ฐานข้อมูลเอง จึงบอกเฉพาะตอนมี
    missingCount > 0 && { label: "เลขว่าง", count: missingCount },
  ].filter(Boolean);

  const linkState = { currentDate: currentDate.toISOString() };

  // แบ่งตามวันโดยคงลำดับเลข วันเดียวกันที่ติดกันรวมเป็นกลุ่มเดียว เลขว่างไม่มีวันที่ อยู่กลุ่มก่อนหน้า
  const dayGroups = [];
  for (const entry of shown) {
    const at = entry.repair?.createdAt || entry.billingNote?.createdAt;
    const key = at ? toLocalDateKey(at) : null;
    const last = dayGroups[dayGroups.length - 1];
    if (last && (!key || last.key === key)) last.entries.push(entry);
    else
      dayGroups.push({
        key: key || `missing-${entry.no}`,
        title: at ? formatDateWithWeekday(at) : "",
        entries: [entry],
      });
  }

  // เก็บเดือนไว้ในประวัติของหน้านี้ ดูบิลแล้วย้อนกลับมาจะได้อยู่เดือนเดิม
  const handleDateChange = (date) => {
    setCurrentDate(date);
    navigate(location.pathname + location.search, {
      replace: true,
      state: { currentDate: date.toISOString() },
    });
  };

  const renderRepair = ({ no, repair }) => {
    const info = getStatusInfo(repair.status, repair.type);
    return (
      <Link
        to={`/repairs/${repair.id}`}
        state={linkState}
        onClick={() => saveScrollPosition(scrollKey)}
        className="mt-4 block"
      >
        <CarCard
          bg={CARD_BG[repair.status] || "primary"}
          icon={
            isSaleRepair(repair) ? (
              <OutlineCardIcon icon={ShoppingBag} color={info.iconColor} />
            ) : isNoVehicleRepair(repair) ? (
              <OutlineCardIcon icon={WrenchOutline} color={info.iconColor} />
            ) : (
              <BrandIcons
                brand={repair.vehicle?.vehicleModel?.brand}
                color={info.iconColor}
              />
            )
          }
          licensePlate={no}
          badge={repair.status === "CANCELLED" ? "ยกเลิก" : undefined}
          brand={getRepairTitle(repair)}
          price={Number(repair.totalPrice) || 0}
        />
      </Link>
    );
  };

  const renderBillingNote = ({ no, billingNote }) => (
    <Link
      to={`/organizations/${billingNote.customer.id}`}
      onClick={() => saveScrollPosition(scrollKey)}
      className="mt-4 block"
    >
      <CarCard
        bg="primary"
        icon={
          <OutlineCardIcon
            icon={organizationIcon(billingNote.customer.organizationType)}
            color="#1976d2"
          />
        }
        licensePlate={no}
        brand={billingNote.customer.name}
      />
    </Link>
  );

  // เลขที่ไม่มีเอกสาร = บิลที่ถูกลบหลังจากมีเลขถัดไปแล้ว คืนเลขไม่ได้ ลำดับจึงขาดช่วง
  const renderMissing = ({ no }) => (
    <div className="mt-4 flex h-20 items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-2">
      <div className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-full bg-gray-100">
        <Hash className="text-subtle-light h-5 w-5" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-subtle-dark truncate text-lg font-semibold md:text-xl">
          {no}
        </p>
        <p className="text-subtle-light truncate text-base font-medium md:text-lg">
          เลขว่าง ไม่มีเอกสารเลขนี้
        </p>
      </div>
    </div>
  );

  return (
    <div className="desktop-column flex min-h-svh flex-col">
      <ReportPeriodHeader
        title="เลขที่เอกสาร"
        periodType="monthly"
        currentDate={currentDate}
        onDateChange={handleDateChange}
        onBack={() =>
          window.history.length > 1 ? navigate(-1) : navigate("/vehicles")
        }
        showPeriodTabs={false}
        pickerAtTop
      >
        <p className="text-surface/80 text-lg md:text-xl">ออกเลขแล้ว</p>
        <p className="text-surface text-[32px] leading-tight font-semibold md:text-[34px]">
          {`${isLoading ? 0 : shownData.lastNo} เลข`}
        </p>
      </ReportPeriodHeader>

      <div className="bg-surface -mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl px-5 pb-28 xl:pb-4">
        {/* ทรงเดียวกับแถวเลือกเอกสารในหน้าตัวอย่างใบเสร็จ */}
        <div className="grid grid-cols-2 gap-2 pt-4">
          {DOC_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() =>
                setSearchParams(
                  { type: type.id },
                  { replace: true, state: location.state },
                )
              }
              aria-pressed={prefix === type.id}
              className={`font-athiti h-9.5 cursor-pointer rounded-[20px] border text-lg font-semibold duration-300 md:text-xl ${
                prefix === type.id
                  ? "bg-primary text-surface border-transparent"
                  : "border-subtle-light text-subtle-dark bg-surface"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : entries.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-subtle-light text-center text-xl text-balance md:text-[22px]">
              ไม่มีเลขที่เอกสารในเดือนนี้
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-4">
              {summary.map((row) => (
                <div key={row.label} className="flex justify-between">
                  <p className="text-subtle-dark text-lg font-medium md:text-xl">
                    {row.label}
                  </p>
                  <p
                    className={`text-lg font-semibold md:text-xl ${
                      row.label !== "ใช้งาน" && row.count > 0
                        ? "text-destructive"
                        : "text-normal"
                    }`}
                  >
                    {row.count} เลข
                  </p>
                </div>
              ))}
            </div>

            {/* สวิตช์แบบเดียวกับตัวกรองรุ่นรถในหน้าสต็อก */}
            {canFilterCancelled && (
              <button
                type="button"
                onClick={() => setOnlyProblems(!onlyProblems)}
                aria-pressed={onlyProblems}
                className="mt-4 flex cursor-pointer items-center gap-2 self-start"
              >
                <span
                  className={`flex h-5.5 w-9.5 shrink-0 items-center rounded-full p-[3px] duration-300 ${
                    onlyProblems ? "bg-primary" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`bg-surface h-4 w-4 rounded-full duration-300 ${
                      onlyProblems ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </span>
                <span
                  className={`text-base font-medium md:text-lg ${
                    onlyProblems ? "text-primary" : "text-subtle-dark"
                  }`}
                >
                  แสดงเฉพาะเลขที่ยกเลิก
                </span>
              </button>
            )}

            {shown.length === 0 ? (
              <div className="flex flex-1 items-center justify-center py-10">
                <p className="text-subtle-light text-center text-xl text-balance md:text-[22px]">
                  {onlyProblems ? "ไม่พบเลขที่ยกเลิก" : "ไม่มีเลขที่เอกสาร"}
                </p>
              </div>
            ) : (
              dayGroups.map((group, index) => (
                <div key={`${group.key}-${index}`}>
                  {group.title && (
                    <div className="mt-4 flex items-center gap-2">
                      <p className="text-subtle-dark text-lg font-semibold md:text-xl">
                        {group.title}
                      </p>
                      <span className="text-subtle-light text-lg md:text-xl">
                        ({group.entries.length})
                      </span>
                      <div className="bg-subtle-light/40 h-px flex-1" />
                    </div>
                  )}
                  {group.entries.map((entry) => (
                    <div key={entry.no}>
                      {entry.missing
                        ? renderMissing(entry)
                        : entry.billingNote
                          ? renderBillingNote(entry)
                          : renderRepair(entry)}
                    </div>
                  ))}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentNumbers;
