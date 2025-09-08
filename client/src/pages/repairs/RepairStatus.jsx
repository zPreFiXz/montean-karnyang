import CarCard from "@/components/cards/CarCard";
import { Car } from "@/components/icons/Icon";
import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams, useNavigate } from "react-router";
import { getRepairs } from "@/api/repair";
import { formatTime } from "@/lib/utils";
import { LoaderCircle, ChevronLeft } from "lucide-react";

const RepairStatus = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { status } = useParams();
  const [repairs, setRepairs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchRepairs();
  }, []);

  const fetchRepairs = async () => {
    try {
      const res = await getRepairs();
      setRepairs(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // กรองรายการซ่อมตามสถานะที่เลือก
  const currentRepairs = repairs
    .filter((repair) => {
      const dbStatus = repair.status?.toLowerCase().replace("_", "-");
      const isStatusMatch = dbStatus === status;

      // ถ้าเป็นสถานะ "paid" ให้แสดงแค่ของวันนี้
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
    .sort((a, b) => {
      // ถ้าเป็นสถานะ "paid" ให้เรียงตาม paidAt จากใหม่ไปเก่า
      if (status === "paid") {
        return new Date(b.paidAt) - new Date(a.paidAt);
      }
      // สถานะอื่นๆ เรียงตาม createdAt จากใหม่ไปเก่า
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const getStatusTitle = () => {
    switch (status) {
      case "in-progress":
        return "รายการกำลังซ่อม";
      case "completed":
        return "รายการซ่อมเสร็จสิ้น";
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
        return "in-progress";
      case "completed":
        return "completed";
      case "paid":
        return "paid";
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
      case "paid":
        return "ไม่มีรายการที่ชำระเงินแล้ว";
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-[142px] bg-gradient-primary shadow-primary">
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-[2px] text-surface"
        >
          <ChevronLeft />
        </button>
        <p className="font-semibold text-[24px] md:text-[26px] text-surface">
          สถานะการซ่อม
        </p>
      </div>
      <div className="flex justify-center gap-[16px] mx-[20px] mt-[16px]">
        <Link
          to="/repair/status/in-progress"
          className={`flex items-center justify-center w-[106px] md:w-[120px] h-[45px] rounded-[10px] duration-200 border-2 font-semibold text-[18px] md:text-[20px] ${
            location.pathname === "/repair/status/in-progress"
              ? "border-white text-surface bg-in-progress"
              : "border-subtle-light  text-subtle-light bg-surface"
          }`}
        >
          กำลังซ่อม
        </Link>
        <Link
          to="/repair/status/completed"
          className={`flex items-center justify-center w-[106px] md:w-[120px] h-[45px] rounded-[10px] duration-200 border-2 font-semibold text-[18px] md:text-[20px] ${
            location.pathname === "/repair/status/completed"
              ? "border-white text-surface bg-completed"
              : "border-subtle-light text-subtle-light bg-surface"
          }`}
        >
          ซ่อมเสร็จสิ้น
        </Link>
        <Link
          to="/repair/status/paid"
          className={`flex items-center justify-center w-[106px] md:w-[120px] h-[45px] rounded-[10px] duration-200 border-2 font-semibold text-[18px] md:text-[20px] ${
            location.pathname === "/repair/status/paid"
              ? "border-white text-surface bg-paid"
              : "border-subtle-light text-subtle-light bg-surface"
          }`}
        >
          ชำระเงินแล้ว
        </Link>
      </div>
      <div className="w-full min-h-[calc(100vh-126px)] px-[20px] pb-[112px] mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <p className="pt-[16px] font-semibold text-[22px] md:text-[24px] text-normal">
          {getStatusTitle()}
        </p>
        {isLoading ? (
          <div className="flex justify-center items-center h-[435px]">
            <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : currentRepairs.length === 0 ? (
          <div className="flex items-center justify-center h-[435px]">
            <p className="text-[20px] md:text-[22px] text-subtle-light">
              {getEmptyMessage()}
            </p>
          </div>
        ) : (
          currentRepairs.map((item, index) => (
            <Link
              key={index}
              to={`/repair/${item.id}`}
              className="block w-full h-[80px] mt-[16px] rounded-[10px] bg-surface shadow-primary"
            >
              <CarCard
                bg={getStatusBg(item.status)}
                color={getStatusColor(item.status)}
                icon={Car}
                licensePlate={`${item.vehicle.licensePlate.plateNumber} ${item.vehicle.licensePlate.province}`}
                brand={`${item.vehicle.vehicleBrandModel.brand} ${item.vehicle.vehicleBrandModel.model}`}
                time={item.createdAt && formatTime(item.createdAt)}
                price={Number(item.totalPrice) || 0}
              />
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default RepairStatus;
