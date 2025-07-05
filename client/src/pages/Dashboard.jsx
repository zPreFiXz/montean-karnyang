import StatusCard from "@/components/cards/StatusCard";
import { Repairing } from "@/components/icons/Icon";

const Dashboard = () => {
  return (
    <div>
      {/* Income Card */}
      <div
        className="w-[385px] h-[157px] p-[16px] mt-[24px] ml-[24px] rounded-[10px]"
        style={{ boxShadow: "0px 0px 50px 0 rgba(0,0,0,0.1)" }}
      >
        <p className="font-medium text-[22px] text-subtle-dark">
          วันที่ 1 มีนาคม 2568
        </p>
        <div
          className="flex justify-between items-center w-[353px] h-[80px] px-[16px] mt-[12px] rounded-[10px] bg-primary"
          style={{ boxShadow: "0px 0px 50px 0 rgba(0,0,0,0.1)" }}
        >
          <p className="font-medium text-[22px] text-surface">ยอดขายวันนี้</p>
          <p className="font-medium text-[32px] text-surface">5,400 ฿</p>
        </div>
      </div>
      {/* Status Card */}
      <div
        className="w-[1123px] h-[510px] p-[16px] mt-[24px] ml-[24px] mb-[24px] rounded-[10px]"
        style={{ boxShadow: "0px 0px 50px 0 rgba(0,0,0,0.1)" }}
      >
        <p className="font-medium text-[22px] text-subtle-dark">สถานะการซ่อม</p>
        <div className="flex items-center gap-[16px] mt-[16px]">
          <StatusCard bg="progress" icon={Repairing} />
          {/* <StatusCard bg="done" />
          <StatusCard bg="payment" /> */}
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
