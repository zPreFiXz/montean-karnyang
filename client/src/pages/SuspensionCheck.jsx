import { Success } from "@/components/icons/Icon";

const SuspensionCheck = () => {
  return (
    <div className="w-full h-[500px] bg-primary shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]">
      <p className="pt-[16px] pl-[20px] font-semibold text-[22px] text-surface">
        เช็คช่วงล่าง
      </p>
      <div className="px-[20px] pt-[16px]">
        <p className="font-medium text-[18px] text-surface mb-[8px]">
          ชื่อลูกค้า
        </p>
        <input
          type="text"
          placeholder="กรอกชื่อลูกค้า"
          className="w-full h-[40px] px-[12px] rounded-[10px] bg-white border border-gray-300 text-[16px] text-black placeholder-subtle-dark focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="px-[20px] pt-[16px]">
        <p className="font-medium text-[18px] text-surface mb-[8px]">
          ยี่ห้อรถ
        </p>
        <input
          type="text"
          placeholder="กรอกยี่ห้อรถ"
          className="w-full h-[40px] px-[12px] rounded-[10px] bg-white border border-gray-300 text-[16px] text-black placeholder-subtle-dark focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="px-[20px] pt-[16px]">
        <p className="font-medium text-[18px] text-surface mb-[8px]">รุ่นรถ</p>
        <input
          type="text"
          placeholder="กรอกรุ่นรถ"
          className="w-full h-[40px] px-[12px] rounded-[10px] bg-white border border-gray-300 text-[16px] text-black placeholder-subtle-dark focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="px-[20px] pt-[16px]">
        <p className="font-medium text-[18px] text-surface mb-[8px]">
          ทะเบียนรถ
        </p>
        <input
          type="text"
          placeholder="กรอกทะเบียนรถ"
          className="w-full h-[40px] px-[12px] rounded-[10px] bg-white border border-gray-300 text-[16px] text-black placeholder-subtle-dark focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="w-full min-h-[calc(100vh-30px)] mt-[30px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-center px-[20px] pt-[20px]">
          <p className="font-semibold text-[22px] text-normal">รายการซ่อม</p>
        </div>
        <div className="flex justify-center gap-[16px] mx-[20px] mt-[16px] ]">
          <div className="flex items-center justify-center w-[78px] h-[30px] rounded-[10px] bg-primary shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]">
            <p className="font-medium text-[18px] text-surface">ซ้าย</p>
          </div>
          <div className="flex items-center justify-center w-[78px] h-[30px] rounded-[10px] bg-surface shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]">
            <p className="font-medium text-[18px] text-subtle-light">ขวา</p>
          </div>
        </div>
        <div className="flex items-center gap-[16px] mt-[16px] mx-auto px-[20px]">
          <Success color="#5B46F4" />
          <div className="flex justify-between items-center w-[313px] h-[80px] px-[8px] rounded-[10px] bg-white shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]">
            <div className="flex items-center gap-[8px]">
              <div className="w-[60px] h-[60px] rounded-[10px] border border-subtle-light bg-white shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]"></div>
              <p className="font-semibold text-[14px] text-subtle-dark">
                ลูกหมากปีกนกบน
              </p>
            </div>
            <p className="font-semibold text-[18px] ml-[8px] text-primary">
              500 บาท
            </p>
          </div>
        </div>
        <div className="flex items-center gap-[16px] mt-[16px] mx-auto px-[20px]">
          <Success color="#AFB1B6" />
          <div className="flex justify-between items-center w-[313px] h-[80px] px-[8px] rounded-[10px] bg-white shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]">
            <div className="flex items-center gap-[8px]">
              <div className="w-[60px] h-[60px] rounded-[10px] border border-subtle-light bg-white shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]"></div>
              <p className="font-semibold text-[14px] text-subtle-dark">
                ลูกหมากปีกนกล่าง
              </p>
            </div>
            <p className="font-semibold text-[18px] ml-[8px] text-primary">
              0 บาท
            </p>
          </div>
        </div>
        <div className="flex items-center gap-[16px] mt-[16px] mx-auto px-[20px]">
          <Success color="#AFB1B6" />
          <div className="flex justify-between items-center w-[313px] h-[80px] px-[8px] rounded-[10px] bg-white shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]">
            <div className="flex items-center gap-[8px]">
              <div className="w-[60px] h-[60px] rounded-[10px] border border-subtle-light bg-white shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]"></div>
              <p className="font-semibold text-[14px] text-subtle-dark">
                ลูกหมากคันชัก
              </p>
            </div>
            <p className="font-semibold text-[18px] ml-[8px] text-primary">
              0 บาท
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center px-[20px] pt-[20px]">
          <p className="font-semibold text-[18px] text-subtle-dark">
            รวม 1 รายการ
          </p>
          <p className="font-semibold text-[18px] text-primary ">500 บาท</p>
        </div>
        <div className="flex justify-center px-[20px]">
          <button className="bg-primary text-white font-semibold text-[16px] mt-[16px] w-full h-[40px] rounded-[10px] shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]">
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
};
export default SuspensionCheck;
