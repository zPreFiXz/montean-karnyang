const RepairCreate = () => {
  return (
    <div className="w-full h-[500px] bg-primary shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]">
      <p className="pt-[16px] pl-[20px] font-semibold text-[20px] text-surface">
        รายการซ่อมใหม่
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
      <div className="w-full h-full mt-[30px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-center px-[20px] pt-[20px]">
          <p className="font-semibold text-[20px] text-normal">รายการซ่อม</p>
          <p className="font-medium text-[18px] text-primary cursor-pointer">
            เพิ่มรายการ
          </p>
        </div>
        <div>
          <div className="w-[335px] h-[80px] rounded-[10px] mx-auto mt-[16px] bg-white flex justify-center items-center shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]">
            <p className="text-[16px] text-gray-500">ไม่มีรายการซ่อม</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepairCreate;
