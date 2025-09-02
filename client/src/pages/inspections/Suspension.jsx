import FormInput from "@/components/forms/FormInput";
import { Success } from "@/components/icons/Icon";
import { useForm } from "react-hook-form";
import { useState } from "react";
import LicensePlateInput from "@/components/forms/LicensePlateInput";

const SuspensionCheck = () => {
  const { register, handleSubmit, reset } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [savedData, setSavedData] = useState(null);

  const handleSuspensionCheck = async (data) => {
    setIsSubmitting(true);
    console.log("Suspension check data:", data);

    // จำลองการบันทึกข้อมูล
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // เก็บข้อมูลที่บันทึก
    setSavedData({
      ...data,
      licensePlate:
        data.plate_letters +
        "-" +
        data.plate_numbers +
        " " +
        data.plate_province,
    });

    setIsSubmitting(false);
    setShowSuccessMessage(true);
    // ไม่ล้างฟอร์ม เพื่อให้ข้อมูลยังแสดงอยู่

    // ซ่อนข้อความสำเร็จหลัง 3 วินาที
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  return (
    <div className="w-full min-h-[calc(100vh-30px)] bg-gradient-primary shadow-primary">
      <p className="pt-[16px] pl-[20px] font-semibold text-[22px] text-surface">
        เช็คช่วงล่าง
      </p>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mx-[20px] mt-[16px] p-[12px] bg-green-500 text-white rounded-[10px] flex items-center gap-[8px]">
          <span className="text-[16px]">✓</span>
          <span className="font-medium">บันทึกข้อมูลเรียบร้อยแล้ว!</span>
        </div>
      )}

      <form onSubmit={handleSubmit(handleSuspensionCheck)}>
        <FormInput
          register={register}
          name="fullName"
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
                name="plate_province"
                placeholder="อุบลราชธานี"
                type="text"
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
            className={`w-[200px] h-[41px] rounded-[20px] font-semibold text-[18px] shadow-primary transition-all duration-200 transform ${
              isSubmitting
                ? "bg-surface/60 text-primary/60 cursor-not-allowed"
                : "bg-surface text-primary hover:bg-surface/90 active:bg-surface/80 cursor-pointer hover:scale-105 active:scale-95"
            }`}
          >
            {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>
        </div>
      </form>
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
          <Success color="#1976d2" />
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
          <button className="bg-primary text-white font-semibold text-[16px] mt-[16px] w-full h-[41px] rounded-[10px] shadow-primary">
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
};
export default SuspensionCheck;
