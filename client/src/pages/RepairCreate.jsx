import { useForm } from "react-hook-form";
import FormInputs from "@/components/form/FormInputs";

const RepairCreate = () => {
  const { register, handleSubmit } = useForm();

  const handleCreateRepair = (data) => {
    console.log("Repair data:", data);
    // TODO: ส่งข้อมูลไป API
  };

  return (
    <div className="w-full h-[500px] bg-gradient-primary shadow-primary">
      <p className="pt-[16px] pl-[20px] font-semibold text-[22px] text-surface">
        รายการซ่อมใหม่
      </p>
      
      <form onSubmit={handleSubmit(handleCreateRepair)}>
        <FormInputs
          register={register}
          name="customer_name"
          label="ชื่อลูกค้า"
          placeholder="กรอกชื่อลูกค้า"
          color="surface"
        />
        <FormInputs
          register={register}
          name="brand"
          label="ยี่ห้อรถ"
          placeholder="กรอกยี่ห้อรถ"
          color="surface"
        />
        <FormInputs
          register={register}
          name="model"
          label="รุ่นรถ"
          placeholder="กรอกรุ่นรถ"
          color="surface"
        />
        <FormInputs
          register={register}
          name="plate_number"
          label="ทะเบียนรถ"
          placeholder="กรอกทะเบียนรถ"
          color="surface"
        />
        <FormInputs
          register={register}
          name="province"
          label="จังหวัด"
          placeholder="กรอกจังหวัด"
          color="surface"
        />
        <FormInputs
          register={register}
          name="description"
          label="รายละเอียดการซ่อม"
          placeholder="กรอกรายละเอียดการซ่อม"
          color="surface"
        />
        
        <div className="px-[20px] mt-[16px]">
          <button
            type="submit"
            className="w-full h-[40px] bg-primary text-white rounded-[20px] hover:bg-primary-dark font-medium"
          >
            สร้างรายการซ่อม
          </button>
        </div>
      </form>      
      <div className="w-full min-h-[calc(100vh-600px)] mt-[30px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
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
