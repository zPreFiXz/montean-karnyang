import React from "react";

const Status = () => {
  return (
    <div
      className="w-full h-[246px] bg-primary shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]"
    >
      <p className="pt-[16px] pl-[20px] font-semibold text-[20px] text-surface">
        สถานะการซ่อม
      </p>
      <div className="flex justify-center gap-[17px] mx-[20px] mt-[16px] ]">
        <div
          className="flex items-center justify-center w-[106px] h-[45px] rounded-[10px] bg-progress shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]"
        >
          <p className="font-medium text-[18px] text-surface">กำลังซ่อม</p>
        </div>
        <div
          className="flex items-center justify-center w-[106px] h-[45px] rounded-[10px] bg-surface shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]"
        >
          <p className="font-medium text-[18px] text-subtle-light">ซ่อมเสร็จสิ้น</p>
        </div>
        <div
          className="flex items-center justify-center  w-[106px] h-[45px] rounded-[10px] bg-surface shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]"
        >
          <p className="font-medium text-[18px] text-subtle-light">ชำระเงินแล้ว</p>
        </div>
      </div>
      <div
        className="w-full h-full mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]"
      >
        <p className="pt-[20px] pl-[20px] font-semibold text-[20px] text-normal">
          รายการกำลังซ่อม
        </p>

        <div
          className="w-[335px] h-[80px] rounded-[10px] mx-auto mt-[16px] bg-white shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]"
        ></div>
      </div>
    </div>
  );
};

export default Status;
