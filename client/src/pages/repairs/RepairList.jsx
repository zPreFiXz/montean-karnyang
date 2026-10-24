import PageSpinner from "@/components/ui/PageSpinner";
import { useState, useEffect } from "react";
import { Link, Navigate, useSearchParams, useNavigate } from "react-router";
import {
  saveScrollPosition,
  useScrollRestoration,
} from "@/utils/scrollPosition";
import { ChevronLeft, Wrench as WrenchOutline } from "lucide-react";
import CarCard from "@/components/cards/CarCard";
import OutlineCardIcon from "@/components/icons/OutlineCardIcon";
import useRepairStore from "@/stores/useRepairStore";
import { formatTime, formatDateShort } from "@/utils/formats";
import BrandIcons from "@/components/icons/BrandIcons";
import { Success, Wrench, Paid, Credit } from "@/components/icons/Icons";
import SearchBar from "@/components/forms/SearchBar";
import { ClipboardList } from "lucide-react";
import { Wallet } from "lucide-react";
import { ShoppingBag } from "lucide-react";
import {
  isSaleRepair,
  isNoVehicleRepair,
  getRepairTitle,
  getRepairSubtitle,
} from "@/utils/repairDisplay";
import { toastError } from "@/utils/handleError";
import { usePrefetchPages } from "@/routes/pageImports";

const RepairList = () => {
  usePrefetchPages(["RepairDetail"]);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get("status") || "in-progress";
  const { repairs, fetchRepairs } = useRepairStore();
  const [isLoading, setIsLoading] = useState(repairs.length === 0);

  useEffect(() => {
    fetchRepairsData();
  }, []);

  const scrollKey = `/repairs?status=${status}`;
  useScrollRestoration(scrollKey, !isLoading);

  const fetchRepairsData = async () => {
    if (repairs.length === 0) setIsLoading(true);
    try {
      await fetchRepairs();
    } catch (error) {
      toastError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // เวลาที่โชว์กับเวลาที่ใช้เรียงต้องเป็นค่าเดียวกัน ไม่งั้นการ์ดจะดูเรียงมั่ว
  // บิลเก่าที่ยังไม่มีเวลาของจังหวะนั้นใช้เวลาที่เปิดบิลแทน
  const showsDate = status === "estimate" || status === "credit";

  const cardTimeOf = (repair) => {
    if (status === "paid") return repair.paidAt || repair.createdAt;
    if (status === "completed" || status === "credit") {
      return repair.completedAt || repair.createdAt;
    }
    return repair.createdAt;
  };

  const creditCount = repairs.filter((r) => r.status === "CREDIT").length;
  const estimateCount = repairs.filter((r) => r.status === "ESTIMATE").length;

  const search = (searchParams.get("search") || "").trim().toLowerCase();
  const matchesSearch = (repair) => {
    if (!search) return true;
    const plate = repair?.vehicle?.licensePlate;
    return [
      plate?.plateNumber,
      plate?.province,
      repair?.vehicle?.vehicleModel?.brand,
      repair?.vehicle?.vehicleModel?.model,
      repair?.vehicle?.fleetNo,
      repair?.customer?.name,
      repair?.receiptNo,
      repair?.deliveryNo,
      repair?.quotationNo,
    ]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(search));
  };

  const currentRepairs = repairs
    .filter((repair) => {
      const dbStatus = repair.status?.toLowerCase().replace("_", "-");
      const isStatusMatch = dbStatus === status;

      if (status === "paid" && isStatusMatch) {
        const today = new Date();
        const paidDate = new Date(repair.paidAt);

        const isSameDay =
          today.getFullYear() === paidDate.getFullYear() &&
          today.getMonth() === paidDate.getMonth() &&
          today.getDate() === paidDate.getDate();

        return isSameDay;
      }

      if (status === "estimate" && isStatusMatch) return matchesSearch(repair);

      // บิลเครดิตของหน่วยงานหรือร้านค้าอยู่ที่หน้าหน่วยงานและร้านค้า
      if (status === "credit" && isStatusMatch) {
        return !repair.customer?.organizationType && matchesSearch(repair);
      }

      return isStatusMatch;
    })
    .sort((a, b) => new Date(cardTimeOf(b)) - new Date(cardTimeOf(a)));

  const getStatusTitle = () => {
    switch (status) {
      case "estimate":
        return "รายการใบประเมินราคา";
      case "in-progress":
        return "รายการกำลังซ่อม";
      case "completed":
        return "รายการซ่อมเสร็จสิ้น";
      case "credit":
        return "รายการเครดิต";
      case "paid":
        return "รายการชำระเงินแล้ว";
      default:
        return null;
    }
  };

  const getStatusColor = (repairStatus) => {
    const status = repairStatus?.toLowerCase().replace("_", "-");
    switch (status) {
      case "estimate":
        return "#06b6d4";
      case "in-progress":
        return "#ffb000";
      case "completed":
        return "#22c55e";
      case "credit":
        return "#7c3aed";
      case "paid":
        return "#1976d2";
      default:
        return null;
    }
  };

  const getStatusBg = (repairStatus) => {
    const status = repairStatus?.toLowerCase().replace("_", "-");
    switch (status) {
      case "estimate":
        return "estimate";
      case "in-progress":
        return "progress";
      case "completed":
        return "completed";
      case "credit":
        return "credit";
      case "paid":
        return "paid";
      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "estimate":
        return { Icon: ClipboardList, bg: "bg-status-estimate" };
      case "in-progress":
        return { Icon: Wrench, bg: "bg-status-progress" };
      case "completed":
        return { Icon: Success, bg: "bg-status-completed" };
      case "credit":
        return { Icon: Credit, bg: "bg-status-credit" };
      case "paid":
        return { Icon: Paid, bg: "bg-status-paid" };
      default:
        return null;
    }
  };

  const getEmptyMessage = () => {
    switch (status) {
      case "estimate":
        return search
          ? `ไม่พบ "${searchParams.get("search")}"`
          : "ไม่มีใบประเมินราคา";
      case "in-progress":
        return "ไม่มีรายการที่กำลังซ่อม";
      case "completed":
        return "ไม่มีรายการที่ซ่อมเสร็จสิ้น";
      case "credit":
        return search
          ? `ไม่พบ "${searchParams.get("search")}"`
          : "ไม่มีรายการเครดิต";
      case "paid":
        return "ไม่มีรายการที่ชำระเงินแล้ว";
      default:
        return null;
    }
  };

  const statusIcon = getStatusIcon();

  // ต้องอยู่หลังฮุคทั้งหมด ไม่งั้นลำดับฮุคจะไม่เท่ากันทุกรอบ
  if (status === "credit") {
    return <Navigate to="/organizations?type=general" replace />;
  }

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-4">
        <button
          // เข้ามาจากแท็บไหนก็ได้ จึงถอยประวัติ (เปิดลิงก์ตรงๆ ไม่มีประวัติ จึงมีเส้นทางสำรอง)
          onClick={() => {
            const isSidePile = status === "credit" || status === "estimate";
            if (isSidePile && window.history.length > 1) {
              navigate(-1);
              return;
            }
            navigate(isSidePile ? "/repairs?status=in-progress" : "/dashboard");
          }}
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface min-w-0 flex-1 truncate text-2xl font-semibold md:text-[26px]">
          {status === "estimate"
            ? "ประเมินราคา"
            : status === "credit"
              ? "เครดิต"
              : "สถานะการซ่อม"}
        </p>

        {status !== "estimate" && status !== "credit" && (
          <Link
            to="/repairs?status=estimate"
            aria-label={`ใบประเมินราคา ${estimateCount} รายการ`}
            title="ใบประเมินราคา"
            className="bg-surface/20 relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          >
            <ClipboardList className="text-surface h-5 w-5" />
            {estimateCount > 0 && (
              <span className="bg-surface text-primary absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-sm font-semibold">
                {estimateCount}
              </span>
            )}
          </Link>
        )}

        {status !== "credit" && status !== "estimate" && (
          <Link
            to="/organizations"
            aria-label={`เครดิต ${creditCount} รายการ`}
            title="เครดิต"
            className="bg-surface/20 relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          >
            <Wallet className="text-surface h-5 w-5" />
            {creditCount > 0 && (
              <span className="bg-surface text-primary absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-sm font-semibold">
                {creditCount}
              </span>
            )}
          </Link>
        )}
      </div>

      {status !== "credit" && status !== "estimate" && (
        <div className="scrollbar-hide mt-4 flex justify-start gap-4 overflow-x-auto px-5 xl:justify-center">
          <Link
            to="/repairs?status=in-progress"
            className={`flex h-[45px] w-26.5 shrink-0 items-center justify-center rounded-lg border-2 text-lg font-semibold duration-300 md:w-30 md:text-xl ${
              status === "in-progress"
                ? "text-surface bg-status-progress border-white"
                : "border-subtle-light text-subtle-light bg-surface"
            }`}
          >
            กำลังซ่อม
          </Link>
          <Link
            to="/repairs?status=completed"
            className={`flex h-[45px] w-26.5 shrink-0 items-center justify-center rounded-lg border-2 text-lg font-semibold duration-300 md:w-30 md:text-xl ${
              status === "completed"
                ? "text-surface bg-status-completed border-white"
                : "border-subtle-light text-subtle-light bg-surface"
            }`}
          >
            ซ่อมเสร็จสิ้น
          </Link>
          <Link
            to="/repairs?status=paid"
            className={`flex h-[45px] w-26.5 shrink-0 items-center justify-center rounded-lg border-2 text-lg font-semibold duration-300 md:w-30 md:text-xl ${
              status === "paid"
                ? "text-surface bg-status-paid border-white"
                : "border-subtle-light text-subtle-light bg-surface"
            }`}
          >
            ชำระเงินแล้ว
          </Link>
        </div>
      )}
      <div className="bg-surface shadow-primary mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl px-5 pb-28">
        {status !== "estimate" && status !== "credit" && (
          <div className="flex items-center gap-2 pt-4">
            {statusIcon && (
              <div
                // ไอคอน lucide รับสีตามข้อความ ต่างจากไอคอนของโปรเจคที่ฝังสีขาวไว้
                className={`${statusIcon.bg} text-surface flex h-10 w-10 shrink-0 items-center justify-center rounded-full`}
              >
                <statusIcon.Icon />
              </div>
            )}
            <p className="text-normal text-[22px] font-semibold md:text-2xl">
              {getStatusTitle()}
            </p>
            {/* ไม่ขึ้นระหว่างโหลด เพราะเลข 0 ที่เด้งเป็นเลขจริงทีหลังทำให้เข้าใจผิด */}
            {!isLoading && currentRepairs.length > 0 && (
              <span className="text-subtle-light shrink-0 text-lg font-medium md:text-xl">
                ({currentRepairs.length})
              </span>
            )}
          </div>
        )}
        {(status === "estimate" || status === "credit") && (
          <div className="pt-4">
            <SearchBar placeholder="ค้นหาทะเบียน, ยี่ห้อ, รุ่นรถ, ชื่อลูกค้า" />
          </div>
        )}

        {isLoading ? (
          <PageSpinner />
        ) : currentRepairs.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-subtle-light px-5 text-center text-xl text-balance md:text-[22px]">
              {getEmptyMessage()}
            </p>
          </div>
        ) : (
          currentRepairs.map((item, index) => (
            <Link
              key={index}
              to={`/repairs/${item.id}`}
              state={{ from: "repair-status", statusSlug: status }}
              onClick={() => saveScrollPosition(scrollKey)}
              className="bg-surface shadow-primary mt-4 block h-20 w-full rounded-lg"
            >
              <CarCard
                bg={getStatusBg(item.status)}
                icon={
                  isSaleRepair(item) ? (
                    <OutlineCardIcon
                      icon={ShoppingBag}
                      color={getStatusColor(item.status)}
                    />
                  ) : isNoVehicleRepair(item) ? (
                    <OutlineCardIcon
                      icon={WrenchOutline}
                      color={getStatusColor(item.status)}
                    />
                  ) : (
                    <BrandIcons
                      brand={item.vehicle?.vehicleModel?.brand}
                      color={getStatusColor(item.status)}
                    />
                  )
                }
                licensePlate={getRepairTitle(item)}
                brand={getRepairSubtitle(item)}
                time={
                  showsDate
                    ? undefined
                    : cardTimeOf(item) && formatTime(cardTimeOf(item))
                }
                note={
                  showsDate && cardTimeOf(item)
                    ? formatDateShort(cardTimeOf(item))
                    : undefined
                }
                price={Number(item.totalPrice) || 0}
              />
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default RepairList;
