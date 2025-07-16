import React from "react";
import { ImageIcon } from "lucide-react";
import InputField from "@/components/ui/InputField";

const NewStock = () => {
  return (
    <div className="w-full min-h-[calc(100vh-30px)] bg-gradient-primary shadow-primary">
      <p className="pt-[16px] pl-[20px] font-semibold text-[22px] text-surface">
        สต็อกอะไหล่
      </p>
      <div className="w-full min-h-[calc(100vh-30px)] mt-[30px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <p className="pt-[16px] px-[20px] font-semibold text-[20px] text-subtle-dark">
          รูปอะไหล่
        </p>
        <div className="flex justify-center mt-[8px]">
          <div className="flex flex-col items-center justify-center w-[244px] h-[169px] border-2 border-dashed border-white rounded-[10px] bg-surface shadow-primary cursor-pointer hover:bg-gray-50 transition-colors">
            <ImageIcon className="w-[48px] h-[48px] text-subtle-light mb-[8px]" />
            <p className="font-medium text-[16px] text-subtle-light">
              อัพโหลดรูปอะไหล่
            </p>
          </div>
        </div>
        <InputField label="รหัสอะไหล่" placeholder="กรอกรหัสอะไหล่" color="subtle-dark"/>
        <InputField label="ชื่ออะไหล่" placeholder="กรอกรหัสอะไหล่" color="subtle-dark"/>
        <InputField label="หมวดหมู่" placeholder="กรอกหมวดหมู่" color="subtle-dark"/>
        <InputField label="ราคาต้นทุน" placeholder="กรอกราคาต้นทุน" color="subtle-dark"/>
        <InputField label="ราคาขาย" placeholder="กรอกราคาขาย" color="subtle-dark"/>
        <InputField label="จำนวน" placeholder="กรอกจำนวน" color="subtle-dark"/>
        <InputField label="แจ้งเตือน" placeholder="กรอกแจ้งเตือน" color="subtle-dark"/>
      </div>
    </div>
  );
};

export default NewStock;
