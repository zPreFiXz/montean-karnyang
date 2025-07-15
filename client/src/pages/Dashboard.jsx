import CarCard from "@/components/cards/CarCard";
import StatusCard from "@/components/cards/StatusCard";
import { Success, Repairing, Paid, Car } from "@/components/icons/Icon";
import axios from "axios";
import { Link } from "react-router";

const Dashboard = () => {
  const handleSubmit = async (data) => {
    await axios
      .post("http://localhost:3000/api/vehicle", data)
      .then((res) => {
        console.log(res.data);
      })
      .catch((error) => {
        console.log(error.response.data);
      });
  };

  return (
    <div className="w-full">
      {/* Desktop Layout */}
      <div className="hidden lg:block w-full px-[24px]">
        {/* Income Card */}
        <div className="w-fit h-[157px] p-[16px] mt-[24px] rounded-[10px] shadow-primary">
          <p className="font-medium text-[22px] text-subtle-dark">
            วันที่ 1 มีนาคม 2568
          </p>
          <div
            className="flex justify-between items-center w-[353px] h-[80px] px-[16px] mt-[12px] rounded-[10px] bg-primary shadow-primary cursor-pointer"
          >
            <p className="font-medium text-[22px] text-surface">ยอดขายวันนี้</p>
            <p className="font-medium text-[32px] text-surface">5,400 ฿</p>
          </div>
        </div>

        {/* Status Card */}
        <div className="w-full min-h-[calc(100vh-302px)] h-auto p-[16px] mt-[24px] mb-[24px] rounded-[10px] shadow-primary">
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

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="w-full h-[217px] pt-[16px] px-[20px] bg-gradient-primary">
          <p className="font-semibold text-[32px] text-surface">
            มณเฑียรการยาง
          </p>
          <p className="font-medium text-[18px] text-surface">
            วันที่ 1 มีนาคม 2568
          </p>
          <Link
            to="/sales/daily"
            className="flex justify-between items-center w-full h-[80px] px-[16px] mx-auto mt-[16px] rounded-[10px] bg-surface shadow-primary cursor-pointer"
          >
            <p className="font-medium text-[18px] text-subtle-dark">
              ยอดขายวันนี้
            </p>
            <p className="font-semibold text-[32px] text-primary">5,400 ฿</p>
          </Link>
        </div>
        <div className="flex flex-col w-full min-h-[calc(100vh-201px)] gap-[16px] px-[20px] -mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface">
          <p className="pt-[16px] font-semibold text-[22px] text-normal">
            สถานะการซ่อม
          </p>
          {/* Status Card */}
          <CarCard
            bg="in-progress"
            color="#F4B809"
            icon={Repairing}
            plateId={"กำลังซ่อม"}
            amount={5}
          />
          <CarCard
            bg="completed"
            color="#66BB6A"
            icon={Success}
            plateId={"ซ่อมเสร็จสิ้น"}
            amount={2}
          />
          <CarCard
            bg="paid"
            color="#1976D2"
            icon={Paid}
            plateId={"ชำระเงินแล้ว"}
            amount={10}
          />
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
