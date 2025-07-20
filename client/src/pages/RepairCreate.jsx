import FormInputs from "@/components/form/FormInputs";

const RepairCreate = () => {
  return (
    <div className="w-full h-[500px] bg-gradient-primary shadow-primary">
      <p className="pt-[16px] pl-[20px] font-semibold text-[22px] text-surface">
        รายการซ่อมใหม่
      </p>
      <FormInputs
        label="ชื่อลูกค้า"
        placeholder="กรอกชื่อลูกค้า"
        color="surface"
      />
      <FormInputs label="ยี่ห้อรถ" placeholder="กรอกยี่ห้อรถ" color="surface" />
      <FormInputs label="รุ่นรถ" placeholder="กรอกรุ่นรถ" color="surface" />
      <FormInputs
        label="ทะเบียนรถ"
        placeholder="กรอกทะเบียนรถ"
        color="surface"
      />
      <div className="w-full min-h-[calc(100vh-440px)] mt-[30px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <div className="flex justify-between items-center px-[20px] pt-[20px]">
          <p className="font-semibold text-[22px]">รายการซ่อม</p>
          <p className="font-medium text-[18px] text-primary cursor-pointer">
            เพิ่มรายการ
          </p>
        </div>
        <div className="flex justify-center items-center h-[115px]">
          <p className="text-[18px] text-subtle-light">ไม่มีรายการซ่อม</p>
        </div>
      </div>
    </div>
  );
};

export default RepairCreate;
