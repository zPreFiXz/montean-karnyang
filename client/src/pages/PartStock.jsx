import { Search } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import { Tire, Shock, Oil, ToolBox } from "@/components/icons/Icon";

const PartStock = () => {
  const [activeTab, setActiveTab] = useState("ทั้งหมด");

  const tabs = [
    { id: "ทั้งหมด", name: "ทั้งหมด", icon: ToolBox },
    { id: "ยาง", name: "ยาง", icon: Tire },
    { id: "ช่วงล่าง", name: "ช่วงล่าง", icon: Shock },
    { id: "น้ำมันเครื่อง", name: "น้ำมันเครื่อง", icon: Oil },
  ];

  return (
    <div className="w-full h-[500px] bg-gradient-primary shadow-primary">
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
          
          {/* แท็บหมวดหมู่ */}
          <div className="flex gap-[18px] mt-[16px] overflow-x-auto pb-[8px]">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center gap-[8px] px-[20px] py-[12px] rounded-[20px] whitespace-nowrap transition-all duration-200 w-[120px] ${
                    isActive
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-white text-subtle-dark border border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-[48px] h-[48px] flex items-center justify-center ${
                    isActive ? 'text-white' : 'text-subtle-dark'
                  }`}>
                    <IconComponent />
                  </div>
                  <div className="font-semibold text-[16px]">{tab.name}</div>
                </button>
              );
            })}
          </div>
          {/* หัวข้อและกล่องอะไหล่ */}
          <div className="w-full pt-[20px]">
            {/* หัวข้อ */}
            <div className="flex justify-between items-center">
              <p className="font-semibold text-[22px]">รายการอะไหล่</p>
              <Link
                to="/stock/new"
                className="font-semibold text-[18px] text-primary cursor-pointer hover:text-primary/80 transition-colors"
              >
                เพิ่มรายการ
              </Link>
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
