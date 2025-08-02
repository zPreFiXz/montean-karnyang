import FormInput from "@/components/form/FormInput";
import { useForm } from "react-hook-form";
import FormButton from "@/components/form/FormButton";
import { createPart } from "@/api/part";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { getCategories } from "@/api/category";
import ComboBox from "@/components/ui/ComboBox";
import FormUploadImage from "@/components/form/FormUploadImage";
import { resizeImage } from "@/utils/resizeImage";
import { uploadImage } from "@/api/uploadImage";

const CreatePart = () => {
  const { register, handleSubmit, setValue, watch, reset } = useForm();
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      let image = null;

      if (selectedImage) {
        const resizedImage = await resizeImage(selectedImage);
        const res = await uploadImage(resizedImage);

        image = {
          publicId: res.data?.public_id,
          secureUrl: res.data?.secure_url,
        };
      }

      const partData = {
        ...data,
        image,
      };

      const response = await createPart(partData);
      toast.success(response.data.message);
      reset();
      setSelectedImage(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      toast.error("เพิ่มอะไหล่ไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="w-full bg-gradient-primary shadow-primary">
      <div className="pt-[16px] pl-[20px] font-semibold text-[22px] text-surface">
        สต็อกอะไหล่
      </div>
      <section className="w-full mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <FormUploadImage
          setSelectedImage={setSelectedImage}
          selectedImage={selectedImage}
        />
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormInput
            register={register}
            name="partNumber"
            label="รหัสอะไหล่"
            type="text"
            placeholder="เช่น P001, BR-123"
            color="subtle-dark"
          />
          <FormInput
            register={register}
            name="name"
            label="ชื่ออะไหล่"
            type="text"
            placeholder="เช่น ยางรถยนต์ มิชลิน"
            color="subtle-dark"
          />
          <ComboBox
            label="หมวดหมู่"
            options={categories}
            value={watch("categoryId")}
            onChange={(value) => setValue("categoryId", value)}
            placeholder="-- เลือกหมวดหมู่ --"
          />
          <FormInput
            register={register}
            name="costPrice"
            label="ต้นทุน (บาท)"
            type="number"
            placeholder="เช่น 500"
            color="subtle-dark"
            onWheel={(e) => e.target.blur()}
          />
          <FormInput
            register={register}
            name="sellingPrice"
            label="ราคาขาย (บาท)"
            type="number"
            placeholder="เช่น 750"
            color="subtle-dark"
            onWheel={(e) => e.target.blur()}
          />
          <FormInput
            register={register}
            name="stockQuantity"
            label="จำนวนสต็อก"
            type="number"
            placeholder="เช่น 10"
            color="subtle-dark"
            onWheel={(e) => e.target.blur()}
          />
          <FormInput
            register={register}
            name="minStockLevel"
            label="สต็อกขั้นต่ำ"
            type="number"
            placeholder="เช่น 3"
            color="subtle-dark"
            onWheel={(e) => e.target.blur()}
          />
          <div className="flex justify-center pb-[60px]">
            <FormButton label="เพิ่มอะไหล่" isLoading={isSubmitting} />
          </div>
        </form>
      </section>
    </main>
  );
};

export default CreatePart;
