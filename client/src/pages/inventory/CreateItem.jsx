import FormInput from "@/components/forms/FormInput";
import { useForm } from "react-hook-form";
import FormButton from "@/components/forms/FormButton";
import { createPart } from "@/api/part";
import { createService } from "@/api/service";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { getCategories } from "@/api/category";
import ComboBox from "@/components/ui/ComboBox";
import FormUploadImage from "@/components/forms/FormUploadImage";
import { resizeImage } from "@/utils/resizeImage";
import { uploadImage } from "@/api/uploadImage";
import VehicleCompatibilityInput from "@/components/forms/VehicleCompatibilityInput";
import { useNavigate } from "react-router";

const CreatePart = () => {
  const { register, handleSubmit, setValue, watch, reset } = useForm();
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [vehicleKey, setVehicleKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
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

  const isTireCategory = () => {
    const selectedCategoryId = watch("categoryId");
    const selectedCategory = categories.find(
      (cat) => cat.id === selectedCategoryId
    );
    return selectedCategory?.name === "ยาง";
  };

  const handleCategoryChange = (value) => {
    setValue("categoryId", value);

    setValue("costPrice", undefined);
    setValue("sellingPrice", undefined);
    setValue("stockQuantity", undefined);
    setValue("minStockLevel", undefined);

    setValue("width", undefined);
    setValue("aspectRatio", undefined);
    setValue("rimDiameter", undefined);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      let partData = {};
      let serviceData = {};
      let image = null;

      if (selectedImage) {
        const resizedImage = await resizeImage(selectedImage);
        const res = await uploadImage(resizedImage);

        image = {
          publicId: res.data?.public_id,
          secureUrl: res.data?.secure_url,
        };
      }

      if (!isServiceCategory()) {
        partData = {
          partNumber: data.partNumber,
          brand: data.brand,
          name: data.name,
          costPrice: data.costPrice,
          sellingPrice: data.sellingPrice,
          unit: data.unit,
          stockQuantity: data.stockQuantity,
          minStockLevel: data.minStockLevel,
          typeSpecificData: isTireCategory()
            ? {
                width: data.width,
                aspectRatio: data.aspectRatio,
                rimDiameter: data.rimDiameter,
              }
            : undefined,
          compatibleVehicles: watch("compatibleVehicles") || undefined,
          image,
          categoryId: data.categoryId,
        };
      } else {
        serviceData = {
          name: data.name,
          price: data.price,
          categoryId: data.categoryId,
        };
      }

      if (isServiceCategory()) {
        await createService(serviceData);
        toast.success("เพิ่มบริการสำเร็จ");
        navigate("/inventory");
      } else {
        await createPart(partData);
        toast.success("เพิ่มอะไหล่สำเร็จ");
        navigate("/inventory");
      }

      reset();
      setSelectedImage(null);
      setVehicleKey((prev) => prev + 1);
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
    <main className="w-full h-[78px] bg-gradient-primary shadow-primary">
      <div className="pt-[16px] pl-[20px] font-semibold text-[22px] text-surface">
        เพิ่มรายการ
      </div>
      <section className="w-full min-h-[calc(100svh-65px)] sm:min-h-[calc(100vh-65px)] mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <form onSubmit={handleSubmit(onSubmit)}>
          <ComboBox
            label="หมวดหมู่"
            options={categories}
            value={watch("categoryId")}
            onChange={handleCategoryChange}
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
                placeholder="เช่น ตั้งศูนย์, ถ่วงล้อ, เปลี่ยนน้ำมันเครื่อง"
                color="subtle-dark"
              />
              <FormInput
                register={register}
                name="price"
                label="ราคา (บาท)"
                type="text"
                placeholder="เช่น 400"
                color="subtle-dark"
              />
            </div>
          )}

          {/* อะไหล่ */}
          {!isServiceCategory() && (
            <div>
              <FormUploadImage
                label="รูปภาพอะไหล่"
                setSelectedImage={setSelectedImage}
                selectedImage={selectedImage}
              />
              <FormInput
                register={register}
                name="partNumber"
                label="รหัสอะไหล่"
                type="text"
                placeholder="เช่น SB-3882"
                color="subtle-dark"
              />
              <FormInput
                register={register}
                name="brand"
                label="ยี่ห้อ"
                type="text"
                placeholder={
                  isTireCategory() ? "เช่น Linglong, Maxxis" : "เช่น 333, 555"
                }
                color="subtle-dark"
              />
              <FormInput
                register={register}
                name="name"
                label={isTireCategory() ? "รุ่น" : "ชื่ออะไหล่"}
                type="text"
                placeholder={
                  isTireCategory()
                    ? "เช่น CROSSWIND HP010"
                    : "เช่น ลูกหมากปีกนกบน REVO,VIGO 4x2"
                }
                color="subtle-dark"
              />

              {/* ยาง */}
              {isTireCategory() && (
                <div className="space-y-4">
                  <FormInput
                    register={register}
                    name="width"
                    label="หน้ายาง (มม.)"
                    type="text"
                    placeholder="เช่น 195, 205, 215"
                    color="subtle-dark"
                  />
                  <FormInput
                    register={register}
                    name="aspectRatio"
                    label="แก้มยาง (%)"
                    type="text"
                    placeholder="เช่น 55, 60, 65"
                    color="subtle-dark"
                  />
                  <FormInput
                    register={register}
                    name="rimDiameter"
                    label="ขอบ (นิ้ว)"
                    type="text"
                    placeholder="เช่น 15, 16, 17"
                    color="subtle-dark"
                  />
                </div>
              )}
              <FormInput
                register={register}
                name="costPrice"
                label="ต้นทุน (บาท)"
                type="number"
                placeholder="เช่น 800"
                color="subtle-dark"
                onWheel={(e) => e.target.blur()}
              />
              <FormInput
                register={register}
                name="sellingPrice"
                label="ราคาขาย (บาท)"
                type="number"
                placeholder="เช่น 1200"
                color="subtle-dark"
                onWheel={(e) => e.target.blur()}
              />
              <FormInput
                register={register}
                name="unit"
                label="หน่วย"
                type="text"
                placeholder="เช่น ชิ้น, คู่, ชุด, เส้น"
                color="subtle-dark"
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
              {!isTireCategory() && (
                <VehicleCompatibilityInput
                  key={vehicleKey}
                  setValue={setValue}
                  watch={watch}
                />
              )}
            </div>
          )}
          <div className="flex justify-center pb-[88px]">
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
