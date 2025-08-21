import CarCard from "@/components/cards/CarCard";
import StatusCard from "@/components/cards/StatusCard";
import { Success, Repairing, Paid, Car } from "@/components/icons/Icon";
import { useEffect } from "react";
import { Link } from "react-router";
import { formatCurrency, formatTime } from "@/lib/utils";
import useRepairStore from "@/stores/repairStore";

const Dashboard = () => {
  const {
    fetchRepairs,
    getRepairCountByStatus,
    getTodaySales,
    getLatestRepairByStatus,
  } = useRepairStore();

  // ยอดขายวันนี้
  const todaySales = getTodaySales();

  // นับจำนวนการซ่อมแต่ละสถานะ
  const inProgressCount = getRepairCountByStatus("IN_PROGRESS");
  const completedCount = getRepairCountByStatus("COMPLETED");
  const paidCount = getRepairCountByStatus("PAID");

  // การซ่อมล่าสุดของแต่ละสถานะ
  const latestInProgress = getLatestRepairByStatus("IN_PROGRESS");
  const latestCompleted = getLatestRepairByStatus("COMPLETED");
  const latestPaid = getLatestRepairByStatus("PAID");

  const getCurrentDateThai = () => {
    const now = new Date();
    const thaiMonths = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];

    const day = now.getDate();
    const month = thaiMonths[now.getMonth()];
    const year = now.getFullYear() + 543;

    return `วันที่ ${day} ${month} ${year}`;
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    fetchRepairs();
  }, [fetchRepairs]);

  return (
    <div className="w-full">
      {/* มุมมองเดสก์ท็อป */}
      <div className="hidden lg:block w-full px-[24px]">
        {/* ยอดขาย */}
        <div className="w-fit h-[157px] p-[16px] mt-[24px] rounded-[10px] shadow-primary">
          <p className="font-medium text-[22px] text-subtle-dark">
            {getCurrentDateThai()}
          </p>
          <div className="flex justify-between items-center w-[353px] h-[80px] px-[16px] mt-[12px] rounded-[10px] bg-primary shadow-primary cursor-pointer">
            <p className="font-medium text-[22px] text-surface">ยอดขายวันนี้</p>
            <p className="font-medium text-[32px] text-surface">
              {formatCurrency(todaySales)}
            </p>
          </div>
        </div>

        {/* สถานะการซ่อม */}
        <div className="w-full p-[16px] mt-[24px] mb-[24px] rounded-[10px] shadow-primary">
          <p className="font-medium text-[22px] text-subtle-dark">
            สถานะการซ่อม
          </p>
          <div className="flex justify-start items-start gap-[16px] mt-[16px]">
            {/* กำลังซ่อม */}
            <div className="flex-1 flex-col items-center gap-[16px]">
              <StatusCard
                bg="in-progress"
                icon={Repairing}
                label={"กำลังซ่อม"}
                amount={inProgressCount}
              />
              <div className="mt-[16px]">
                {latestInProgress && (
                  <Link to="/repairs/status/in-progress">
                    <CarCard
                      bg="in-progress"
                      color="#F4B809"
                      icon={Car}
                      licensePlate={`${
                        latestInProgress.vehicle?.licensePlate?.plateNumber ||
                        "ไม่ระบุ"
                      } ${
                        latestInProgress.vehicle?.licensePlate?.province || ""
                      }`}
                      band={`${latestInProgress.vehicle?.brand || ""} ${
                        latestInProgress.vehicle?.model || ""
                      }`}
                      time={formatTime(latestInProgress.startedAt)}
                      price={parseFloat(latestInProgress.totalPrice)}
                    />
                  </Link>
                )}
              </div>
            </div>

            {/* ซ่อมเสร็จสิ้น */}
            <div className="flex-1 flex-col items-center gap-[16px]">
              <StatusCard
                bg="completed"
                icon={Success}
                label={"ซ่อมเสร็จสิ้น"}
                amount={completedCount}
              />
              <div className="mt-[16px]">
                {latestCompleted && (
                  <Link to="/repairs/status/completed">
                    <CarCard
                      bg="completed"
                      color="#66BB6A"
                      icon={Car}
                      licensePlate={`${
                        latestCompleted.vehicle?.licensePlate?.plateNumber ||
                        "ไม่ระบุ"
                      } ${
                        latestCompleted.vehicle?.licensePlate?.province || ""
                      }`}
                      band={`${latestCompleted.vehicle?.brand || ""} ${
                        latestCompleted.vehicle?.model || ""
                      }`}
                      time={
                        latestCompleted.completedAt
                          ? formatTime(latestCompleted.completedAt)
                          : "-"
                      }
                      price={parseFloat(latestCompleted.totalPrice)}
                    />
                  </Link>
                )}
              </div>
            </div>

            {/* ชำระเงินแล้ว */}
            <div className="flex-1 flex-col items-center gap-[16px]">
              <StatusCard
                bg="paid"
                icon={Paid}
                label={"ชำระเงินแล้ว"}
                amount={paidCount}
              />
              <div className="mt-[16px]">
                {latestPaid && (
                  <Link to="/repairs/status/paid">
                    <CarCard
                      bg="paid"
                      color="#1976D2"
                      icon={Car}
                      licensePlate={`${
                        latestPaid.vehicle?.licensePlate?.plateNumber ||
                        "ไม่ระบุ"
                      } ${latestPaid.vehicle?.licensePlate?.province || ""}`}
                      band={`${latestPaid.vehicle?.brand || ""} ${
                        latestPaid.vehicle?.model || ""
                      }`}
                      time={
                        latestPaid.paidAt ? formatTime(latestPaid.paidAt) : "-"
                      }
                      price={parseFloat(latestPaid.totalPrice)}
                    />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* มุมมองมือถือ */}
      <div className="lg:hidden">
        <div className="w-full h-[217px] pt-[16px] px-[20px] bg-gradient-primary">
          <p className="font-semibold text-[32px] text-surface">
            มณเฑียรการยาง
          </p>
          <p className="font-medium text-[18px] text-surface">
            {getCurrentDateThai()}
          </p>
          <Link
            to="/reports/sales/daily"
            className="flex justify-between items-center w-full h-[80px] px-[16px] mx-auto mt-[16px] rounded-[10px] bg-surface shadow-primary cursor-pointer"
          >
            <p className="font-semibold text-[18px] text-subtle-dark">
              ยอดขายวันนี้
            </p>
            <p className="font-semibold text-[32px] text-primary">
              {formatCurrency(todaySales)}
            </p>
          </Link>
        </div>
        <div className="flex flex-col w-full gap-[16px] px-[20px] -mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface">
          <p className="pt-[16px] font-semibold text-[22px] text-normal">
            สถานะการซ่อม
          </p>
          <Link to="/repairs/status/in-progress">
            <CarCard
              bg="in-progress"
              color="#F4B809"
              icon={Repairing}
              licensePlate={"กำลังซ่อม"}
              amount={inProgressCount > 0 ? inProgressCount : "0"}
            />
          </Link>
          <Link to="/repairs/status/completed">
            <CarCard
              bg="completed"
              color="#66BB6A"
              icon={Success}
              licensePlate={"ซ่อมเสร็จสิ้น"}
              amount={completedCount > 0 ? completedCount : "0"}
            />
          </Link>
          <Link to="/repairs/status/paid">
            <CarCard
              bg="paid"
              color="#1976D2"
              icon={Paid}
              licensePlate={"ชำระเงินแล้ว"}
              amount={paidCount > 0 ? paidCount : "0"}
            />
          </Link>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
