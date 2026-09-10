import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import {
  saveScrollPosition,
  useScrollRestoration,
} from "@/utils/scrollPosition";
import { LoaderCircle, ChevronLeft } from "lucide-react";
import CarCard from "@/components/cards/CarCard";
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
  // เตรียมโค้ดของหน้าที่มักไปต่อจากหน้านี้ กดแล้วจะได้ไม่ต้องรอโหลด
  usePrefetchPages(["RepairDetail"]);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get("status") || "in-progress";
  const { repairs, fetchRepairs } = useRepairStore();
  // เหมือนหน้ารายงาน มีของเดิมอยู่แล้วก็โชว์ไปก่อน แล้วดึงใหม่เงียบๆ
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

  // เวลาที่การ์ดโชว์และเวลาที่ใช้เรียงต้องเป็นค่าเดียวกัน
  // ไม่งั้นเลขบนการ์ดจะไม่ไล่ลำดับ คนอ่านจะนึกว่าเรียงมั่ว
  //
  // แต่ละแท็บสนใจคนละจังหวะ กำลังซ่อมดูว่ารับรถเข้ามาเมื่อไหร่
  // ซ่อมเสร็จสิ้นดูว่าเสร็จแล้วรอลูกค้ามารับนานแค่ไหน ชำระเงินแล้วดูว่าเก็บเงินตอนไหน
  // (บิลเก่าที่ยังไม่มีเวลาของจังหวะนั้นให้ตกกลับไปใช้เวลาที่เปิดบิล)
  // สองกองนี้ค้างข้ามวันได้ รู้ว่ากี่โมงไม่ช่วยอะไร ต้องรู้ว่าค้างมาตั้งแต่วันไหน
  const showsDate = status === "estimate" || status === "credit";

  const cardTimeOf = (repair) => {
    if (status === "paid") return repair.paidAt || repair.createdAt;
    if (status === "completed" || status === "credit") {
      return repair.completedAt || repair.createdAt;
    }
    return repair.createdAt;
  };

  // เครดิตเป็นรายการย่อยของงานที่ซ่อมเสร็จแล้ว ไม่ใช่สถานะที่มีแท็บของตัวเอง
  const creditCount = repairs.filter((r) => r.status === "CREDIT").length;
  const estimateCount = repairs.filter((r) => r.status === "ESTIMATE").length;

  // ใบประเมินราคาสะสมไปเรื่อยๆ ไม่มีวันหมดอายุเหมือนแท็บอื่นที่ไล่ปิดงานได้
  // จึงต้องมีช่องค้นหาเหมือนหน้าประวัติรถ
  const search = (searchParams.get("search") || "").trim().toLowerCase();
  const matchesSearch = (repair) => {
    if (!search) return true;
    const plate = repair?.vehicle?.licensePlate;
    return [
      plate?.plateNumber,
      plate?.province,
      repair?.vehicle?.vehicleModel?.brand,
      repair?.vehicle?.vehicleModel?.model,
      repair?.customer?.name,
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

  // ไอคอนชุดเดียวกับการ์ดสถานะบนหน้าหลัก กดการ์ดไหนเข้ามาก็เจอไอคอนตัวเดิมรออยู่
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
        return "ไม่มีรายการเครดิต";
      case "paid":
        return "ไม่มีรายการที่ชำระเงินแล้ว";
      default:
        return null;
    }
  };

  const statusIcon = getStatusIcon();

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
        <button
          // เครดิตกับใบประเมินราคาเข้ามาจากแท็บไหนก็ได้ผ่านปุ่มลัดบนหัว
          // จึงต้องถอยประวัติกลับไปที่เดิม ไม่ใช่เดาปลายทางไว้ตายตัว
          // (เปิดลิงก์เข้ามาตรงๆ ไม่มีประวัติให้ถอย จึงมีเส้นทางสำรอง)
          onClick={() => {
            const isSidePile = status === "credit" || status === "estimate";
            if (isSidePile && window.history.length > 1) {
              navigate(-1);
              return;
            }
            navigate(isSidePile ? "/repairs?status=in-progress" : "/dashboard");
          }}
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface min-w-0 flex-1 truncate text-2xl font-semibold md:text-[26px]">
          สถานะการซ่อม
        </p>

        {/* เครดิตกับใบประเมินราคาเป็นกองของตัวเอง ไม่ใช่สถานะคู่ขนานกับสามแท็บที่งานเดินอยู่
            จึงอยู่ระดับหน้าและกดได้จากทุกแท็บ อยู่ตำแหน่งเดิมเสมอแม้เหลือศูนย์
            เหลือแต่ไอคอนเพราะคนใช้เป็นพนักงานประจำร้าน กดจนจำได้ว่าปุ่มไหนคืออะไร
            ชื่อเต็มยังอยู่ใน aria-label กับ title ไว้ให้เครื่องอ่านหน้าจอและตอนชี้ค้าง */}
        {status !== "estimate" && status !== "credit" && (
          <Link
            to="/repairs?status=estimate"
            aria-label={`ใบประเมินราคา ${estimateCount} รายการ`}
            title="ใบประเมินราคา"
            className="bg-surface/20 relative flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full"
          >
            <ClipboardList className="text-surface h-5 w-5" />
            {/* เลขศูนย์ไม่ต้องขึ้น ป้ายเปล่าๆ ไม่ได้บอกอะไรนอกจากรกตา */}
            {estimateCount > 0 && (
              <span className="bg-surface text-primary absolute -top-[2px] -right-[2px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-[4px] text-sm font-semibold">
                {estimateCount}
              </span>
            )}
          </Link>
        )}

        {status !== "credit" && status !== "estimate" && (
          <Link
            to="/repairs?status=credit"
            aria-label={`เครดิต ${creditCount} รายการ`}
            title="เครดิต"
            className="bg-surface/20 relative flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full"
          >
            <Wallet className="text-surface h-5 w-5" />
            {creditCount > 0 && (
              <span className="bg-surface text-primary absolute -top-[2px] -right-[2px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-[4px] text-sm font-semibold">
                {creditCount}
              </span>
            )}
          </Link>
        )}
      </div>

      {/* หน้าเครดิตเข้ามาจากการ์ดในแท็บซ่อมเสร็จสิ้น ไม่ใช่สถานะคู่ขนานกับสามอันนี้
          จึงไม่ต้องมีแท็บของตัวเอง และไม่ต้องโชว์แถวแท็บที่ไม่มีอันไหนถูกเลือก */}
      {status !== "credit" && status !== "estimate" && (
        <div className="scrollbar-hide mt-[16px] flex justify-start gap-[16px] overflow-x-auto px-[20px] xl:justify-center">
          <Link
            to="/repairs?status=in-progress"
            className={`flex h-[45px] w-[106px] shrink-0 items-center justify-center rounded-[10px] border-2 text-lg font-semibold duration-300 md:w-[120px] md:text-xl ${
              status === "in-progress"
                ? "text-surface bg-status-progress border-white"
                : "border-subtle-light text-subtle-light bg-surface"
            }`}
          >
            กำลังซ่อม
          </Link>
          <Link
            to="/repairs?status=completed"
            className={`flex h-[45px] w-[106px] shrink-0 items-center justify-center rounded-[10px] border-2 text-lg font-semibold duration-300 md:w-[120px] md:text-xl ${
              status === "completed"
                ? "text-surface bg-status-completed border-white"
                : "border-subtle-light text-subtle-light bg-surface"
            }`}
          >
            ซ่อมเสร็จสิ้น
          </Link>
          <Link
            to="/repairs?status=paid"
            className={`flex h-[45px] w-[106px] shrink-0 items-center justify-center rounded-[10px] border-2 text-lg font-semibold duration-300 md:w-[120px] md:text-xl ${
              status === "paid"
                ? "text-surface bg-status-paid border-white"
                : "border-subtle-light text-subtle-light bg-surface"
            }`}
          >
            ชำระเงินแล้ว
          </Link>
        </div>
      )}
      <div className="bg-surface shadow-primary mt-[16px] flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl px-[20px] pb-[112px]">
        <div className="flex items-center gap-[8px] pt-[16px]">
          {statusIcon && (
            <div
              // ไอคอนของ lucide รับสีตามข้อความ ต้องบอกสีขาวให้เอง
              // ต่างจากไอคอนชุดของโปรเจคที่ฝังเส้นสีขาวไว้ในตัว
              className={`${statusIcon.bg} text-surface flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full`}
            >
              <statusIcon.Icon />
            </div>
          )}
          <p className="text-normal text-[22px] font-semibold md:text-2xl">
            {getStatusTitle()}
          </p>
          {/* จำนวนที่เห็นในลิสต์ตอนนี้ วางแบบเดียวกับหัวข้อในหน้าคลัง
              ไม่ขึ้นระหว่างโหลด เพราะเลข 0 ที่เด้งเป็นเลขจริงทีหลังอ่านแล้วเข้าใจผิด
              ไม่มีสักรายการก็ไม่ต้องขึ้น เพราะข้อความกลางจอบอกอยู่แล้วว่าไม่มีอะไร */}
          {!isLoading && currentRepairs.length > 0 && (
            <span className="text-subtle-light shrink-0 text-lg font-medium md:text-xl">
              ({currentRepairs.length})
            </span>
          )}
        </div>
        {/* ใบประเมินราคาเก็บสะสมยาว จึงมีช่องค้นหาเหมือนหน้าประวัติรถ
            แท็บอื่นเป็นงานที่เดินอยู่ไม่กี่คัน กวาดตาหาเจอเร็วกว่าพิมพ์ */}
        {status === "estimate" && (
          <div className="pt-[16px]">
            <SearchBar placeholder="ค้นหาทะเบียน, ยี่ห้อ, รุ่นรถ, ชื่อลูกค้า" />
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : currentRepairs.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-subtle-light px-[20px] text-center text-xl text-balance md:text-[22px]">
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
              className="bg-surface shadow-primary mt-[16px] block h-[80px] w-full rounded-[10px]"
            >
              <CarCard
                bg={getStatusBg(item.status)}
                icon={
                  isSaleRepair(item) ? (
                    <ShoppingBag className="text-surface h-6 w-6" />
                  ) : isNoVehicleRepair(item) ? (
                    <Wrench />
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
