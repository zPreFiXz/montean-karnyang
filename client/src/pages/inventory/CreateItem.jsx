import { ImageIcon } from "lucide-react";
import FormInput from "@/components/form/FormInput";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import FormButton from "@/components/form/FormButton";
import { createPart } from "@/api/part";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { getCategories } from "@/api/category";
import ComboBox from "@/components/ui/ComboBox";

const CreatePart = () => {
  const { register, handleSubmit, setValue, watch } = useForm();
  const [categories, setCategories] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  console.log(categories);

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data);
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const handleAddInventory = async (data) => {
    try {
      const res = await createPart(data);
      toast.success("เพิ่มอะไหล่สำเร็จ");
    } catch (error) {
      console.error(error);
      toast.error("เพิ่มอะไหล่ไม่สำเร็จ");
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  return (
    <main className="w-full bg-gradient-primary shadow-primary">
      <div className="pt-[16px] pl-[20px] font-semibold text-[22px] text-surface">
        สต็อกอะไหล่
      </div>
      <section className="w-full mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        <Label className="pt-[16px] px-[20px] font-medium text-[18px] text-subtle-dark">
          รูปอะไหล่
        </Label>
        <div className="flex justify-center mt-[8px]">
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="group flex flex-col items-center justify-center w-[280px] h-[280px] border-2 border-dashed border-subtle-light rounded-[20px] bg-surface hover:border-primary duration-300 cursor-pointer"
            >
              {imagePreview ? (
                <div className="relative w-full h-full">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-contain rounded-[20px]"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeImage();
                    }}
                    className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 border border-black/5 hover:border-surface rounded-full font-medium text-lg text-subtle-dark bg-surface hover:bg-primary hover:text-surface shadow-lg hover:shadow-xl backdrop-blur-sm  duration-300 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <ImageIcon className="w-[48px] h-[48px] text-subtle-light mb-[8px] duration-300 group-hover:text-primary group-hover:scale-110" />
                  <p className="font-medium text-[16px] text-subtle-light mb-[4px] transition-colors duration-300 group-hover:text-primary">
                    เลือกรูปอะไหล่
                  </p>
                  <p className="text-[12px] text-subtle-light transition-colors duration-300 group-hover:text-subtle-dark">
                    PNG, JPG ขนาดไม่เกิน 5MB
                  </p>
                </>
              )}
            </label>
          </div>
        </div>
        <form onSubmit={handleSubmit(handleAddInventory)}>
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
          />
          <FormInput
            register={register}
            name="sellingPrice"
            label="ราคาขาย (บาท)"
            type="number"
            placeholder="เช่น 750"
            color="subtle-dark"
          />
          <FormInput
            register={register}
            name="stockQuantity"
            label="จำนวนสต็อก"
            type="number"
            placeholder="เช่น 10"
            color="subtle-dark"
          />
          <FormInput
            register={register}
            name="minStockLevel"
            label="สต็อกขั้นต่ำ"
            type="number"
            placeholder="เช่น 3"
            color="subtle-dark"
          />
          <div className="flex justify-center pb-[60px]">
            <FormButton label="เพิ่มสินค้า" />
          </div>
        </form>
      </section>
    </main>
  );
};

export default CreatePart;
