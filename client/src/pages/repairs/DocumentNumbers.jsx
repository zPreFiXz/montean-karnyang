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
import { formatDateShort } from "@/utils/formats";
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
  const [data, setData] = useState(null);
  const [onlyProblems, setOnlyProblems] = useState(false);
  const period = periodOf(currentDate);
  const requestKey = `${prefix}-${period}`;
  const isLoading = data?.key !== requestKey;

  useEffect(() => {
    let cancelled = false;
    listDocumentNumbers(prefix, period)
      .then((res) => {
        if (!cancelled) setData({ key: `${prefix}-${period}`, ...res.data });
      })
      .catch((error) => {
        if (!cancelled) toastError(error, "โหลดเลขที่เอกสารไม่ได้");
      });
    return () => {
      cancelled = true;
    };
  }, [prefix, period]);

  const scrollKey = location.pathname + location.search;
  useScrollRestoration(scrollKey, !isLoading);

  const entries = isLoading ? [] : data.entries;
  const isCancelled = (entry) => entry.repair?.status === "CANCELLED";
  const cancelledCount = entries.filter(isCancelled).length;
  const missingCount = entries.filter((entry) => entry.missing).length;
  const shown = onlyProblems
    ? entries.filter((entry) => entry.missing || isCancelled(entry))
    : entries;

  const summary = [
    {
      label: "ใช้งาน",
      count: entries.length - cancelledCount - missingCount,
    },
    prefix !== "BL" && { label: "ยกเลิก", count: cancelledCount },
    { label: "เลขว่าง", count: missingCount },
  ].filter(Boolean);

  const linkState = { currentDate: currentDate.toISOString() };

  // เก็บเดือนไว้ในประวัติของหน้านี้ ดูบิลแล้วย้อนกลับมาจะได้อยู่เดือนเดิม
  const handleDateChange = (date) => {
    setCurrentDate(date);
    navigate(location.pathname + location.search, {
      replace: true,
      state: { currentDate: date.toISOString() },
    });
  };

  const renderRepair = ({ no, repair }) => {
    const info = getStatusInfo(repair.status);
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
          date={formatDateShort(repair.createdAt)}
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
        date={formatDateShort(billingNote.createdAt)}
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
    <div className="flex min-h-svh flex-col">
      <ReportPeriodHeader
        title="เลขที่เอกสาร"
        periodType="monthly"
        currentDate={currentDate}
        onDateChange={handleDateChange}
        onBack={() =>
          window.history.length > 1 ? navigate(-1) : navigate("/vehicles")
        }
        showPeriodTabs={false}
      >
        <p className="text-surface/80 text-lg md:text-xl">ออกเลขแล้ว</p>
        <p className="text-surface text-[32px] leading-tight font-semibold md:text-[34px]">
          {isLoading ? "-" : `${data.lastNo} เลข`}
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
            <button
              type="button"
              onClick={() => setOnlyProblems((value) => !value)}
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
                {prefix === "BL"
                  ? "แสดงเฉพาะเลขว่าง"
                  : "แสดงเฉพาะยกเลิกและเลขว่าง"}
              </span>
            </button>

            {shown.length === 0 ? (
              <div className="flex flex-1 items-center justify-center py-10">
                <p className="text-subtle-light text-center text-xl text-balance md:text-[22px]">
                  {prefix === "BL"
                    ? "ไม่พบเลขว่าง"
                    : "ไม่พบเลขที่ยกเลิกหรือเลขว่าง"}
                </p>
              </div>
            ) : (
              shown.map((entry) => (
                <div key={entry.no}>
                  {entry.missing
                    ? renderMissing(entry)
                    : entry.billingNote
                      ? renderBillingNote(entry)
                      : renderRepair(entry)}
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
