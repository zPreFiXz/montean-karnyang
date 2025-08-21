import CarCard from "@/components/cards/CarCard";
import { Car } from "@/components/icons/Icon";
import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router";
import { getRepairs } from "@/api/repair";
import { formatTime } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

const RepairStatus = () => {
  const location = useLocation();
  const { status } = useParams();
  const [repairs, setRepairs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

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

    fetchRepairs();
  }, []);

  // กรองรายการซ่อมตามสถานะที่เลือก
  const currentRepairs = repairs.filter((repair) => {
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
        return "รายการซ่อม";
    }
  };

  const getStatusColor = (repairStatus) => {
    const status = repairStatus?.toLowerCase().replace("_", "-");
    switch (status) {
      case "in-progress":
        return "#F4B809";
      case "completed":
        return "#66BB6A";
      case "paid":
        return "#1976D2";
      default:
        return "#F4B809";
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
        return "in-progress";
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
        return "ไม่มีรายการซ่อม";
    }
  };

  return (
    <div className="w-full h-[137px] bg-gradient-primary shadow-primary">
      <p className="pt-[16px] pl-[20px] font-semibold text-[22px] text-surface">
        สถานะการซ่อม
      </p>
      <div className="flex justify-center gap-[16px] mx-[20px] mt-[16px]">
        <div
          className={`flex items-center justify-center w-[106px] h-[45px] rounded-[10px] duration-200 ${
            location.pathname === "/repairs/status/in-progress"
              ? "bg-in-progress"
              : "bg-surface"
          }`}
        >
          <Link
            to="/repairs/status/in-progress"
            className={`font-semibold text-[18px] ${
              location.pathname === "/repairs/status/in-progress"
                ? "text-surface"
                : "text-subtle-light"
            }`}
          >
            กำลังซ่อม
          </Link>
        </div>
        <div
          className={`flex items-center justify-center w-[106px] h-[45px] rounded-[10px] duration-200 ${
            location.pathname === "/repairs/status/completed"
              ? "bg-[#66BB6A]"
              : "bg-surface"
          }`}
        >
          <Link
            to="/repairs/status/completed"
            className={`font-semibold text-[18px] ${
              location.pathname === "/repairs/status/completed"
                ? "text-surface"
                : "text-subtle-light"
            }`}
          >
            ซ่อมเสร็จสิ้น
          </Link>
        </div>
        <div
          className={`flex items-center justify-center w-[106px] h-[45px] rounded-[10px] duration-200 ${
            location.pathname === "/repairs/status/paid"
              ? "bg-[#1976D2]"
              : "bg-surface"
          }`}
        >
          <Link
            to="/repairs/status/paid"
            className={`font-semibold text-[18px] ${
              location.pathname === "/repairs/status/paid"
                ? "text-surface"
                : "text-subtle-light"
            }`}
          >
            ชำระเงินแล้ว
          </Link>
        </div>
      </div>
      <div className="w-full min-h-[calc(100vh-126px)] px-[20px] pb-[104px] mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <p className="pt-[16px] font-semibold text-[20px] text-normal">
          {getStatusTitle()}
        </p>
        {isLoading ? (
          <div className="flex justify-center items-center h-[435px]">
            <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : currentRepairs.length === 0 ? (
          <div className="flex items-center justify-center h-[435px]">
            <p className="text-[16px] text-subtle-light">{getEmptyMessage()}</p>
          </div>
        ) : (
          currentRepairs.map((repair) => (
            <Link
              key={repair.id}
              to={`/repairs/${repair.id}`}
              className="block w-full h-[80px] mt-[16px] rounded-[10px] bg-surface shadow-primary"
            >
              <CarCard
                bg={getStatusBg(repair.status)}
                color={getStatusColor(repair.status)}
                icon={Car}
                licensePlate={
                  repair.vehicle?.licensePlate
                    ? `${repair.vehicle.licensePlate.plateNumber} ${repair.vehicle.licensePlate.province}`
                    : "ไม่มีทะเบียน"
                }
                band={`${repair.vehicle.brand} ${repair.vehicle.model}`}
                time={repair.createdAt ? formatTime(repair.createdAt) : ""}
                price={Number(repair.totalPrice) || 0}
              />
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default RepairStatus;
