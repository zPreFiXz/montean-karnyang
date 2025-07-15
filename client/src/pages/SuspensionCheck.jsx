import { Success } from "@/components/icons/Icon";
import InputField from "@/components/ui/InputField";

const SuspensionCheck = () => {
  return (
    <div className="w-full h-[500px] bg-gradient-primary shadow-primary">
      <p className="pt-[16px] pl-[20px] font-semibold text-[22px] text-surface">
        เช็คช่วงล่าง
      </p>
      <InputField label="ชื่อลูกค้า" placeholder="กรอกชื่อลูกค้า" />
      <InputField label="ยี่ห้อรถ" placeholder="กรอกยี่ห้อรถ" />
      <InputField label="รุ่นรถ" placeholder="กรอกรุ่นรถ" />
      <InputField label="ทะเบียนรถ" placeholder="กรอกทะเบียนรถ" />
      <div className="w-full min-h-[calc(100vh-30px)] mt-[30px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <div className="px-[20px] pt-[20px]">
          <p className="font-semibold text-[22px] text-normal">รายการซ่อม</p>
        </div>
        <div className="flex justify-center gap-[16px] mx-[20px] mt-[16px] ]">
          <div className="flex items-center justify-center w-[78px] h-[30px] rounded-[10px] bg-primary shadow-primary">
            <p className="font-medium text-[18px] text-surface">ซ้าย</p>
          </div>
          <div className="flex items-center justify-center w-[78px] h-[30px] rounded-[10px] bg-surface shadow-primary">
            <p className="font-medium text-[18px] text-subtle-light">ขวา</p>
          </div>
        </div>
        <div className="flex items-center gap-[16px] mt-[16px] mx-auto px-[20px]">
          <Success color="#5B46F4" />
          <div className="flex justify-between items-center w-[313px] h-[80px] px-[8px] rounded-[10px] bg-white shadow-primary">
            <div className="flex items-center gap-[8px]">
              <div className="w-[60px] h-[60px] rounded-[10px] border border-subtle-light bg-white shadow-primary"></div>
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
          <div className="flex justify-between items-center w-[313px] h-[80px] px-[8px] rounded-[10px] bg-white shadow-primary">
            <div className="flex items-center gap-[8px]">
              <div className="w-[60px] h-[60px] rounded-[10px] border border-subtle-light bg-white shadow-primary"></div>
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
          <div className="flex justify-between items-center w-[313px] h-[80px] px-[8px] rounded-[10px] bg-white shadow-primary">
            <div className="flex items-center gap-[8px]">
              <div className="w-[60px] h-[60px] rounded-[10px] border border-subtle-light bg-white shadow-primary"></div>
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
          <button className="bg-primary text-white font-semibold text-[16px] mt-[16px] w-full h-[40px] rounded-[10px] shadow-primary">
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
};
export default SuspensionCheck;
