import { Search } from "lucide-react";

const PartStock = () => {
  return (
    <div className="w-full h-[500px] bg-primary shadow-primary">
      <p className="pt-[16px] pl-[20px] font-semibold text-[22px] text-surface">
        สต็อกอะไหล่
      </p>
      <div className="w-full min-h-[calc(100vh-30px)] mt-[30px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <div className="px-[20px] pt-[16px]">
          {/* ช่องค้นหา */}
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
          {/* หัวข้อและกล่องอะไหล่ */}
          <div className="w-full pt-[20px]">
            {/* หัวข้อ */}
            <div className="flex justify-between items-center">
              <p className="font-semibold text-[22px]">รายการอะไหล่</p>
              <p className="font-medium text-[18px] text-primary cursor-pointer">
                เพิ่มรายการ
              </p>
            </div>
            {/* กล่องอะไหล่ */}
            <div className="flex items-center gap-[16px] mt-[16px]">
              <div className="flex justify-between items-center w-full h-[80px] px-[8px] rounded-[10px] bg-white shadow-primary">
                <div className="flex items-center gap-[8px]">
                  <div className="w-[60px] h-[60px] rounded-[10px] border border-subtle-light bg-white shadow-primary"></div>
                  <div className="flex flex-col">
                    <p className="font-semibold text-[16px] text-subtle">
                      ลูกหมากปีกนกบน
                    </p>
                    <p className="pt-[3px] font-semibold text-[14px] text-subtle-dark">
                      จำนวน: 10 ชิ้น
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-[18px] ml-[8px] text-primary">
                  500 บาท
                </p>
              </div>
            </div>
            {/* กล่องอะไหล่ */}
            <div className="flex items-center gap-[16px] mt-[16px]">
              <div className="flex justify-between items-center w-full h-[80px] px-[8px] rounded-[10px] bg-white shadow-primary">
                <div className="flex items-center gap-[8px]">
                  <div className="w-[60px] h-[60px] rounded-[10px] border border-subtle-light bg-white shadow-primary"></div>
                  <div className="flex flex-col">
                    <p className="font-semibold text-[16px] text-subtle">
                      โช๊คหน้า
                    </p>
                    <p className="pt-[3px] font-semibold text-[14px] text-subtle-dark">
                      จำนวน: 4 ชิ้น
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-[18px] ml-[8px] text-primary">
                  1500 บาท
                </p>
              </div>
            </div>
            {/* กล่องอะไหล่ */}
            <div className="flex items-center gap-[16px] mt-[16px]">
              <div className="flex justify-between items-center w-full h-[80px] px-[8px] rounded-[10px] bg-white shadow-primary">
                <div className="flex items-center gap-[8px]">
                  <div className="w-[60px] h-[60px] rounded-[10px] border border-subtle-light bg-white shadow-primary"></div>
                  <div className="flex flex-col">
                    <p className="font-semibold text-[16px] text-subtle">
                      น้ำมันเครื่อง
                    </p>
                    <p className="pt-[3px] font-semibold text-[14px] text-subtle-dark">
                      จำนวน: 9 ชิ้น
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-[18px] ml-[8px] text-primary">
                  1250 บาท
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PartStock;
