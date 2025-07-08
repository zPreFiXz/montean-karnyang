import CarCard from "@/components/cards/CarCard";
import StatusCard from "@/components/cards/StatusCard";
import { Success, Repairing, Paid, Car } from "@/components/icons/Icon";

const Dashboard = () => {
  return (
    <div className="w-full">
      <div className="hidden lg:block w-full px-[24px]">
        {/* Income Card */}
        <div
          className="w-fit h-[157px] p-[16px] mt-[24px] rounded-[10px] shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]"
        >
          <p className="font-medium text-[22px] text-subtle-dark">
            วันที่ 1 มีนาคม 2568
          </p>
          <div
            className="flex justify-between items-center w-[353px] h-[80px] px-[16px] mt-[12px] rounded-[10px] bg-primary shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]"
          >
            <p className="font-medium text-[22px] text-surface">ยอดขายวันนี้</p>
            <p className="font-medium text-[32px] text-surface">5,400 ฿</p>
          </div>
        </div>

        {/* Status Card */}
        <div
          className="w-full min-h-[calc(100vh-302px)] h-auto p-[16px] mt-[24px] mb-[24px] rounded-[10px] shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]"
        >
          <p className="font-medium text-[22px] text-subtle-dark">
            สถานะการซ่อม
          </p>
          <div className="flex justify-start items-start gap-[16px] mt-[16px]">
            {/* In Progress Card */}
            <div className="flex-1 flex-col items-center gap-[16px]">
              <StatusCard
                bg="in-progress"
                icon={Repairing}
                label={"กำลังซ่อม"}
                amount={0}
              />
              <div className="mt-[16px]">
                <CarCard
                  bg="in-progress"
                  color="#F4B809"
                  icon={Car}
                  plateId={"ขก1799 อุบลราชธานี"}
                  band={"Honda Jazz"}
                  time={"15:23"}
                  price={4300}
                />
              </div>
            </div>

            {/* Completed Card */}
            <div className="flex-1 flex-col items-center gap-[16px]">
              <StatusCard
                bg="completed"
                icon={Success}
                label={"ซ่อมเสร็จสิ้น"}
                amount={0}
              />
              <div className="mt-[16px]">
                <CarCard
                  bg="completed"
                  color="#66BB6A"
                  icon={Car}
                  plateId={"ขก1799 อุบลราชธานี"}
                  band={"Honda Jazz"}
                  time={"15:23"}
                  price={4300}
                />
              </div>
            </div>

            {/* Paid Card */}
            <div className="flex-1 flex-col items-center gap-[16px]">
              <StatusCard
                bg="paid"
                icon={Paid}
                label={"ชำระเงินแล้ว"}
                amount={0}
              />
              <div className="mt-[16px]">
                <CarCard
                  bg="paid"
                  color="#1976D2"
                  icon={Car}
                  plateId={"ขก1799 อุบลราชธานี"}
                  band={"Honda Jazz"}
                  time={"15:23"}
                  price={4300}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="lg:hidden min-w-screen h-[217px] pt-[16px] px-[20px]"
        style={{
          background:
            "linear-gradient(46.07deg, #5b46f4 2.59%, #8663f8 100.02%)",
        }}
      >
        <p className="font-medium text-[32px] text-surface">
          มณเฑียรการยาง
        </p>
        <p className="font-medium text-[18px] text-surface">
          วันที่ 1 มีนาคม 2568
        </p>
        <div
          className="flex justify-between items-center w-full h-[80px] px-[16px] mx-auto mt-[16px] rounded-[10px] bg-surface shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]"
        >
          <p className="font-medium text-[18px] text-subtle-dark">ยอดขายวันนี้</p>
          <p className="font-medium text-[32px] text-subtle-dark">5,400 ฿</p>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
