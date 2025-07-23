import { ImageIcon } from "lucide-react";
import FormInputs from "@/components/form/FormInputs";
import { useForm } from "react-hook-form";
import { useState } from "react";

const NewStock = () => {
  const { register, handleSubmit, reset } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [savedData, setSavedData] = useState(null);

  const handleNewStock = async (data) => {
    setIsSubmitting(true);
    console.log("New stock data:", data);

    // จำลองการบันทึกข้อมูล
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // เก็บข้อมูลที่บันทึก
    setSavedData({
      ...data,
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
        สต็อกอะไหล่
      </p>
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mx-[20px] mt-[16px] p-[12px] bg-green-500 text-white rounded-[10px] flex items-center gap-[8px]">
          <span className="text-[16px]">✓</span>
          <span className="font-medium">บันทึกข้อมูลเรียบร้อยแล้ว!</span>
        </div>
      )}
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
        <form onSubmit={handleSubmit(handleNewStock)}>
          <FormInputs
            register={register}
            name="id"
            label="รหัสอะไหล่"
            placeholder="กรอกรหัสอะไหล่"
            color="subtle-dark"
          />
          <FormInputs
            register={register}
            name="name"
            label="ชื่ออะไหล่"
            placeholder="กรอกชื่ออะไหล่"
            color="subtle-dark"
          />
          <FormInputs
            register={register}
            name="category"
            label="หมวดหมู่"
            placeholder="กรอกหมวดหมู่"
            color="subtle-dark"
          />
          <FormInputs
            register={register}
            name="cost_price"
            label="ราคาต้นทุน"
            placeholder="กรอกราคาต้นทุน"
            color="subtle-dark"
          />
          <FormInputs
            register={register}
            name="selling_price"
            label="ราคาขาย"
            placeholder="กรอกราคาขาย"
            color="subtle-dark"
          />
          <FormInputs
            register={register}
            name="quantity"
            label="จำนวน"
            placeholder="กรอกจำนวนที่มีในสต็อก"
            color="subtle-dark"
          />
          <FormInputs
            register={register}
            name="min_stock_level"
            label="แจ้งเตือนเมื่อจำนวนต่ำกว่า"
            placeholder="กรอกจำนวนที่ต้องการแจ้งเตือนเพื่อสั่งซื้อ"
            color="subtle-dark"
          />
          <div className="flex justify-center px-[20px] mt-[50px] pb-[100px]">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full h-[40px] rounded-[20px] font-semibold shadow-primary transition-all duration-200 transform ${
                isSubmitting
                  ? "bg-primary/60 text-surface/60 cursor-not-allowed"
                  : "bg-primary text-surface hover:bg-primary/90 active:bg-primary/80 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewStock;
