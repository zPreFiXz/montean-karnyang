import { ChevronRight } from "lucide-react";

const RepairCard = ({ icon: Icon, repairId, itemCount }) => {
  return (
    <div className="bg-surface shadow-primary flex h-[80px] w-full items-center justify-between rounded-[10px] px-[16px]">
      <div className="flex min-w-0 flex-1 items-center gap-[8px]">
        <div className="bg-primary flex h-[45px] w-[45px] items-center justify-center rounded-full">
          <Icon color="white" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-primary text-[20px] font-semibold md:text-[22px]">
            รหัสการซ่อม: {repairId}
          </p>
          <p className="text-subtle-dark text-[18px] font-medium md:text-[20px]">
            รวม {itemCount} รายการ
          </p>
        </div>
      </div>
      
      <div className="text-subtle-light flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#F6F6F6]">
        <ChevronRight />
      </div>
    </div>
  );
};
export default RepairCard;
