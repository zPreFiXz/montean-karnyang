import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import {
  saveScrollPosition,
  useScrollRestoration,
} from "@/utils/scrollPosition";
import { LoaderCircle, ChevronLeft } from "lucide-react";
import CarCard from "@/components/cards/CarCard";
import useRepairStore from "@/stores/useRepairStore";
import { formatTime } from "@/utils/formats";
import BrandIcons from "@/components/icons/BrandIcons";
import { Success, Wrench, Paid, Credit } from "@/components/icons/Icons";
import { Wallet } from "lucide-react";
import { ShoppingBag } from "lucide-react";
import {
  isSaleRepair,
  isNoVehicleRepair,
  getRepairTitle,
  getRepairSubtitle,
} from "@/utils/repairDisplay";
import { toastError } from "@/utils/handleError";

const RepairList = () => {
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
  const cardTimeOf = (repair) => {
    if (status === "paid") return repair.paidAt || repair.createdAt;
    if (status === "completed" || status === "credit") {
      return repair.completedAt || repair.createdAt;
    }
    return repair.createdAt;
  };

  // เครดิตเป็นรายการย่อยของงานที่ซ่อมเสร็จแล้ว ไม่ใช่สถานะที่มีแท็บของตัวเอง
  const creditCount = repairs.filter((r) => r.status === "CREDIT").length;

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

      return isStatusMatch;
    })
    .sort((a, b) => new Date(cardTimeOf(b)) - new Date(cardTimeOf(a)));

  const getStatusTitle = () => {
    switch (status) {
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
          onClick={() =>
            navigate(
              status === "credit" ? "/repairs?status=completed" : "/dashboard",
            )
          }
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface min-w-0 flex-1 truncate text-2xl font-semibold md:text-[26px]">
          สถานะการซ่อม
        </p>

        {/* ทางลัดไปงานที่ลูกค้าติดเงินไว้ อยู่ระดับหน้า ไม่ใช่ในแท็บใดแท็บหนึ่ง
            เพราะเครดิตเป็นกองของตัวเอง ไม่ได้เป็นส่วนหนึ่งของรายการที่ซ่อมเสร็จ
            กดได้จากทุกแท็บ และอยู่ตำแหน่งเดิมเสมอแม้เหลือศูนย์
            (อยู่ในหัวสีน้ำเงิน จึงใช้พื้นโปร่งขาวชุดเดียวกับปุ่มย้อนกลับ) */}
        {status !== "credit" && (
          <Link
            to="/repairs?status=credit"
            className="bg-surface/20 text-surface flex h-[40px] shrink-0 items-center gap-[4px] rounded-full px-[12px] text-lg font-semibold md:text-xl"
          >
            <Wallet className="h-5 w-5" />
            เครดิต {creditCount}
          </Link>
        )}
      </div>
      {/* หน้าเครดิตเข้ามาจากการ์ดในแท็บซ่อมเสร็จสิ้น ไม่ใช่สถานะคู่ขนานกับสามอันนี้
          จึงไม่ต้องมีแท็บของตัวเอง และไม่ต้องโชว์แถวแท็บที่ไม่มีอันไหนถูกเลือก */}
      {status !== "credit" && (
        <div className="mx-[20px] mt-[16px] flex justify-center gap-[16px]">
          <Link
            to="/repairs?status=in-progress"
            className={`flex h-[45px] w-[106px] items-center justify-center rounded-[10px] border-2 text-lg font-semibold duration-300 md:w-[120px] md:text-xl ${
              status === "in-progress"
                ? "text-surface bg-status-progress border-white"
                : "border-subtle-light text-subtle-light bg-surface"
            }`}
          >
            กำลังซ่อม
          </Link>
          <Link
            to="/repairs?status=completed"
            className={`flex h-[45px] w-[106px] items-center justify-center rounded-[10px] border-2 text-lg font-semibold duration-300 md:w-[120px] md:text-xl ${
              status === "completed"
                ? "text-surface bg-status-completed border-white"
                : "border-subtle-light text-subtle-light bg-surface"
            }`}
          >
            ซ่อมเสร็จสิ้น
          </Link>
          <Link
            to="/repairs?status=paid"
            className={`flex h-[45px] w-[106px] items-center justify-center rounded-[10px] border-2 text-lg font-semibold duration-300 md:w-[120px] md:text-xl ${
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
              className={`${statusIcon.bg} flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full`}
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
                time={cardTimeOf(item) && formatTime(cardTimeOf(item))}
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
