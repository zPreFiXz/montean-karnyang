import CarCard from "@/components/cards/CarCard";
import { Car } from "@/components/icons/Icon";
import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router";
import { getRepairs } from "@/api/repair";

const RepairStatus = () => {
  const location = useLocation();
  const { status } = useParams();
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRepairs = async () => {
      try {
        setLoading(true);
        const response = await getRepairs();
        setRepairs(response.data || []);
      } catch (err) {
        console.error("Error fetching repairs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRepairs();
  }, []);

  // กรองรายการซ่อมตามสถานะที่เลือก
  const currentRepairs = repairs.filter((repair) => {
    const dbStatus = repair.status?.toLowerCase().replace("_", "-");
    return dbStatus === status;
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

  // ฟังก์ชันสำหรับตัดข้อความให้สั้นลง
  const truncateText = (text, maxLength) => {
    if (!text) return "ไม่ระบุ";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  return (
    <div className="w-full h-[246px] bg-primary shadow-primary">
      <p className="pt-[16px] pl-[20px] font-semibold text-[20px] text-surface">
        สถานะการซ่อม
      </p>
      <div className="flex justify-center gap-[17px] mx-[20px] mt-[16px]">
        <div
          className={`flex items-center justify-center w-[106px] h-[45px] rounded-[10px] shadow-lg duration-200 ${
            location.pathname === "/repairs/status/in-progress"
              ? "bg-in-progress ring-1 ring-surface ring-offset-1 ring-offset-transparent"
              : "bg-surface"
          }`}
        >
          <Link
            to="/repairs/status/in-progress"
            className={`font-medium text-[18px] ${
              location.pathname === "/repairs/status/in-progress"
                ? "text-surface"
                : "text-subtle-light"
            }`}
          >
            กำลังซ่อม
          </Link>
        </div>
        <div
          className={`flex items-center justify-center w-[106px] h-[45px] rounded-[10px] shadow-lg duration-200 ${
            location.pathname === "/repairs/status/completed"
              ? "bg-[#66BB6A] ring-1 ring-surface ring-offset-1 ring-offset-transparent"
              : "bg-surface"
          }`}
        >
          <Link
            to="/repairs/status/completed"
            className={`font-medium text-[18px] ${
              location.pathname === "/repairs/status/completed"
                ? "text-surface"
                : "text-subtle-light"
            }`}
          >
            ซ่อมเสร็จสิ้น
          </Link>
        </div>
        <div
          className={`flex items-center justify-center w-[106px] h-[45px] rounded-[10px] shadow-lg duration-200 ${
            location.pathname === "/repairs/status/paid"
              ? "bg-[#1976D2] ring-1 ring-surface ring-offset-1 ring-offset-transparent"
              : "bg-surface"
          }`}
        >
          <Link
            to="/repairs/status/paid"
            className={`font-medium text-[18px] ${
              location.pathname === "/repairs/status/paid"
                ? "text-surface"
                : "text-subtle-light"
            }`}
          >
            ชำระเงินแล้ว
          </Link>
        </div>
      </div>
      <div className="w-full min-h-[calc(100vh-125px)] px-[20px] pb-[104px] mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <p className="pt-[16px] font-semibold text-[20px] text-normal">
          {getStatusTitle()}
        </p>

        {loading ? (
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-[16px] text-subtle-light">กำลังโหลด...</p>
          </div>
        ) : currentRepairs.length === 0 ? (
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-[16px] text-subtle-light">
              ไม่มีรายการในสถานะนี้
            </p>
          </div>
        ) : (
          currentRepairs.map((repair) => (
            <div
              key={repair.id}
              className="w-full h-[80px] mt-[16px] rounded-[10px] bg-surface shadow-primary"
            >
              <CarCard
                bg={getStatusBg(repair.status)}
                color={getStatusColor(repair.status)}
                icon={Car}
                plateId={truncateText(
                  repair.vehicle?.licensePlate
                    ? `${repair.vehicle.licensePlate.plateNumber} ${repair.vehicle.licensePlate.province}`
                    : "ไม่มีทะเบียน",
                  18
                )}
                band={truncateText(
                  `${repair.vehicle.brand} ${repair.vehicle.model}`,
                  22
                )}
                time={
                  repair.createdAt
                    ? new Date(repair.createdAt).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""
                }
                price={Number(repair.totalPrice) || 0}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RepairStatus;
