import { ChevronRight } from "lucide-react";

const RepairCard = ({ icon: Icon, repairId, itemCount }) => {
  return (
    <div className="flex justify-between items-center w-full h-[80px] px-[16px] rounded-[10px] bg-surface shadow-primary">
      <div className="flex-1 flex items-center min-w-0 gap-[8px]">
        <div className="flex justify-center items-center w-[45px] h-[45px] rounded-full bg-gradient-primary">
          <Icon color="white" />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <p className="font-semibold text-[20px] md:text-[22px] text-primary">
            รหัสการซ่อม: {repairId}
          </p>
          <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark">
            รวม {itemCount} รายการ
          </p>
        </div>
      </div>
      <div className="flex justify-center items-center w-[32px] h-[32px] rounded-full text-subtle-light bg-[#F6F6F6]">
        <ChevronRight />
      </div>
    </div>
  );
};
export default RepairCard;
