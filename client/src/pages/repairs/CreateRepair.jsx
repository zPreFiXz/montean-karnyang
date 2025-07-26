import { useForm } from "react-hook-form";
import { useState } from "react";
import FormInput from "@/components/form/FormInput";
import LicensePlateInput from "@/components/form/LicensePlateInput";
import api from "@/lib/api";
import { toast } from "sonner";

const CreateRepair = () => {
  const { register, handleSubmit, reset } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [savedData, setSavedData] = useState(null);

  const handleCreateRepair = async (data) => {
    try {
      console.log(data);
      await api.post("/api/repair", {
        brand: data.brand,
        model: data.model,
        plate_number: `${data.plate_letters}${data.plate_numbers}`,
        province: data.province,
        description: data.description,
        total_price: 0,
      });
      toast.success("บันทึกข้อมูลเรียบร้อยแล้ว!");
    } catch (error) {
      console.error("Error creating repair:", error);
    }
  };

  return (
    <div className="w-full h-[1000px] bg-gradient-primary shadow-primary">
      <p className="pt-[16px] pl-[20px] font-semibold text-[22px] text-surface">
        รายการซ่อมใหม่
      </p>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mx-[20px] mt-[16px] p-[12px] bg-green-500 text-white rounded-[10px] flex items-center gap-[8px]">
          <span className="text-[16px]">✓</span>
          <span className="font-medium">บันทึกข้อมูลเรียบร้อยแล้ว!</span>
        </div>
      )}

      <form onSubmit={handleSubmit(handleCreateRepair)}>
        <FormInput
          register={register}
          name="first_name"
          label="ชื่อลูกค้า"
          placeholder="กรอกชื่อลูกค้า"
          color="surface"
        />
        <FormInput
          register={register}
          name="brand"
          label="ยี่ห้อรถ"
          placeholder="กรอกยี่ห้อรถ เช่น Toyota"
          color="surface"
        />
        <FormInput
          register={register}
          name="model"
          label="รุ่นรถ"
          placeholder="กรอกรุ่นรถ เช่น Revo"
          color="surface"
        />
        {/* ทะเบียนรถ 3 ช่องในแถวเดียว */}
        <div className="px-[20px] pt-[16px]">
          <p className="font-medium text-[18px] text-surface mb-[8px]">
            ทะเบียนรถ
          </p>
          <div className="flex gap-[12px] items-center">
            <div className="flex-1">
              <LicensePlateInput
                register={register}
                name="plate_letters"
                placeholder="กข"
                type="text"
                maxLength={3}
                onInput={(e) => {
                  e.target.value = e.target.value
                    .replace(/[^ก-ฮ0-9]/g, "")
                    .slice(0, 3);
                }}
              />
            </div>
            <span className="text-surface font-medium text-[18px]">-</span>
            <div className="flex-1">
              <LicensePlateInput
                register={register}
                name="plate_numbers"
                placeholder="1234"
                type="text"
                pattern="[0-9]*"
                maxLength={4}
                onInput={(e) => {
                  e.target.value = e.target.value
                    .replace(/[^0-9]/g, "")
                    .slice(0, 4);
                }}
              />
            </div>
            <div className="flex-1">
              <LicensePlateInput
                register={register}
                name="province"
                placeholder="อุบลราชธานี"
              />
            </div>
          </div>
        </div>

        <FormInput
          register={register}
          name="description"
          label="รายละเอียดการซ่อม"
          placeholder="กรอกรายละเอียดการซ่อม"
          color="surface"
        />
        <div className="flex justify-center px-[20px] mt-[16px]">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-[200px] h-[40px] rounded-[20px] font-semibold shadow-primary transition-all duration-200 transform ${
              isSubmitting
                ? "bg-surface/60 text-primary/60 cursor-not-allowed"
                : "bg-surface text-primary hover:bg-surface/90 active:bg-surface/80 cursor-pointer hover:scale-105 active:scale-95"
            }`}
          >
            {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>
        </div>
      </form>
      <div className="w-full min-h-[calc(200vh-600px)] mt-[30px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
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

export default CreateRepair;
