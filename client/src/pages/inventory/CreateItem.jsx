import FormInput from "@/components/form/FormInput";
import { useForm } from "react-hook-form";
import FormButton from "@/components/form/FormButton";
import { createPart } from "@/api/part";
import { createService } from "@/api/service";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { getCategories } from "@/api/category";
import ComboBox from "@/components/ui/ComboBox";
import FormUploadImage from "@/components/form/FormUploadImage";
import { resizeImage } from "@/utils/resizeImage";
import { uploadImage } from "@/api/uploadImage";
import VehicleCompatibilityInput from "@/components/form/VehicleCompatibilityInput";

const CreatePart = () => {
  const { register, handleSubmit, setValue, watch, reset } = useForm();
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [vehicleKey, setVehicleKey] = useState(0);

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

  const isServiceCategory = () => {
    const selectedCategoryId = watch("categoryId");
    const selectedCategory = categories.find(
      (cat) => cat.id === selectedCategoryId
    );
    return selectedCategory?.name === "บริการ";
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      let image = null;

      if (!isServiceCategory() && selectedImage) {
        const resizedImage = await resizeImage(selectedImage);
        const res = await uploadImage(resizedImage);

        image = {
          publicId: res.data?.public_id,
          secureUrl: res.data?.secure_url,
        };
      }

      const partData = {
        partNumber: data.partNumber,
        name: data.name,
        costPrice: Number(data.costPrice),
        sellingPrice: Number(data.sellingPrice),
        stockQuantity: Number(data.stockQuantity),
        unit: data.unit,
        minStockLevel: Number(data.minStockLevel),
        compatibleVehicles: watch("compatibleVehicles"),
        publicId: image?.publicId,
        secureUrl: image?.secureUrl,
        categoryId: Number(data.categoryId),
      };

      const serviceData = {
        name: data.name,
        price: Number(data.price),
        categoryId: Number(data.categoryId),
      };

      if (isServiceCategory()) {
        await createService(serviceData);
        toast.success("เพิ่มบริการสำเร็จ");
      } else {
        await createPart(partData);
        toast.success("เพิ่มอะไหล่สำเร็จ");
      }

      reset();
      setSelectedImage(null);
      setVehicleKey((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      if (isServiceCategory()) {
        toast.error("เพิ่มบริการไม่สำเร็จ");
      } else {
        toast.error("เพิ่มอะไหล่ไม่สำเร็จ");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="w-full bg-gradient-primary shadow-primary">
      <div className="pt-[16px] pl-[20px] font-semibold text-[22px] text-surface">
        {isServiceCategory() ? "เพิ่มบริการ" : "เพิ่มอะไหล่"}
      </div>
      <section className="w-full mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <form onSubmit={handleSubmit(onSubmit)}>
          <ComboBox
            label="หมวดหมู่"
            options={categories}
            value={watch("categoryId")}
            onChange={(value) => setValue("categoryId", value)}
            placeholder="-- เลือกหมวดหมู่ --"
          />

          {/* บริการ */}
          {isServiceCategory() && (
            <div>
              <FormInput
                register={register}
                name="name"
                label="ชื่อบริการ"
                type="text"
                placeholder="เช่น ตั้งศูนย์, ถ่วงล้อ"
                color="subtle-dark"
              />
              <FormInput
                register={register}
                name="price"
                label="ราคา (บาท)"
                type="text"
                placeholder="เช่น 500"
                color="subtle-dark"
              />
            </div>
          )}

          {/* อะไหล่ */}
          {!isServiceCategory() && (
            <div>
              <FormUploadImage
                setSelectedImage={setSelectedImage}
                selectedImage={selectedImage}
              />
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
                name="unit"
                label="หน่วย"
                type="text"
                placeholder="เช่น ชิ้น, ลิตร"
                color="subtle-dark"
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
              <div className="px-5 py-3">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  รถที่เข้ากันได้
                </label>
                <VehicleCompatibilityInput
                  key={vehicleKey}
                  setValue={setValue}
                  watch={watch}
                />
              </div>
            </div>
          )}
          <div className="flex justify-center pb-[60px]">
            <FormButton
              label={isServiceCategory() ? "เพิ่มบริการ" : "เพิ่มอะไหล่"}
              isLoading={isSubmitting}
            />
          </div>
        </form>
      </section>
    </main>
  );
};

export default CreatePart;
