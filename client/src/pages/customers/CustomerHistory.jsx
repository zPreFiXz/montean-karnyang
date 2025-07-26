import CarCard from "@/components/cards/CarCard";
import { Car } from "@/components/icons/Icon";
import { Search } from "lucide-react";

const CustomerHistory = () => {
  return (
    <div className="w-full h-[500px] bg-gradient-primary shadow-primary">
      <p className="pt-[16px] pl-[20px] font-semibold text-[22px] text-surface">
        ประวัติลูกค้า
      </p>
      <div className="w-full min-h-[calc(100vh-30px)] mt-[30px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <div className="px-[20px] pt-[16px]">
          <div className="relative flex items-center">
            <div className="absolute left-[12px] h-full flex items-center text-subtle-dark">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="ค้นหา"
              className="w-full h-[40px] pl-[40px] pr-[12px] rounded-[10px] bg-white border text-[16px] text-black placeholder-subtle-dark focus:outline-none focus:ring-2 focus:ring-primary shadow-primary"
            />
          </div>
        </div>
        <div className="mt-[16px] px-[20px]">
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
    </div>
  );
};
export default CustomerHistory;
