import FormInput from "@/components/forms/FormInput";
import FormUploadImage from "@/components/forms/FormUploadImage";
import FieldErrorList from "@/components/forms/FieldErrorList";
import ComboBox from "@/components/ui/ComboBox";
import { canHaveServiceImage } from "@/constants/services";
import { useUnitOptions } from "@/constants/units";
import { SIDE_OPTIONS } from "@/utils/suspension";

const ServiceFields = ({
  register,
  watch,
  setValue,
  errors,
  itemWord,
  readsAsPart,
  selectedImage,
  setSelectedImage,
  publicId,
  onMarkImageForDeletion,
}) => {
  const { serviceUnitOptions } = useUnitOptions();

  return (
    <div className="mb-[16px]">
      {/* จุ๊บลมใส่รูปได้เหมือนอะไหล่ งานบริการทั่วไปกับอะไหล่อื่นๆ ไม่มีรูปให้ใส่
      รูปอยู่ก่อนชื่อ ลำดับเดียวกับฟอร์มอะไหล่ */}
      {canHaveServiceImage(watch("name")) && (
        <FormUploadImage
          label="รูปภาพอะไหล่"
          setSelectedImage={setSelectedImage}
          selectedImage={selectedImage}
          publicId={publicId}
          onMarkForDeletion={onMarkImageForDeletion}
        />
      )}
      <FormInput
        register={register}
        name="name"
        label={`ชื่อ${itemWord}`}
        type="text"
        placeholder={readsAsPart ? "เช่น จุ๊บลม" : "เช่น ตั้งศูนย์"}
        color="subtle-dark"
        errors={errors}
      />

      {/* บริการที่ทำทีละข้าง (ตั้งลูกปืนล้อ) ตอนหยิบลงบิลจะถามว่าข้างไหน เหมือนอะไหล่ */}
      <div className="my-[16px] px-[20px]">
        <ComboBox
          label="ข้าง"
          color="text-subtle-dark"
          labelClass="text-xl"
          options={SIDE_OPTIONS}
          value={watch("suspensionType") || "single"}
          onChange={(value) => setValue("suspensionType", value)}
          name="suspensionType"
        />
      </div>

      {/* ราคากับหน่วยอยู่แถวเดียวกัน อ่านต่อกันได้ว่า "100 บาท ต่อ ล้อ"
          หน่วยเว้นว่างได้ บริการส่วนใหญ่คิดเป็นครั้ง ไม่ต้องบอกหน่วย */}
      <div className="mt-[16px] px-[20px]">
        <div className="grid grid-cols-2 gap-[8px]">
          <FormInput
            register={register}
            name="price"
            label="ราคา (บาท)"
            type="number"
            placeholder="เช่น 400"
            color="subtle-dark"
            customClass="w-full"
            errors={errors}
            hideErrorMessage
            inputMode="numeric"
          />
          <div className="w-full">
            <ComboBox
              label="หน่วย"
              color="text-subtle-dark"
              labelClass="text-xl"
              options={serviceUnitOptions}
              value={watch("unit") || ""}
              onChange={(value) =>
                setValue("unit", value, { shouldValidate: true })
              }
              creatable
              createLabel={(text) => `เพิ่มหน่วย "${text}"`}
              customClass="text-lg md:text-xl"
              errors={errors}
              hideErrorMessage
              name="unit"
            />
          </div>
        </div>
        <FieldErrorList
          className="mt-[6px]"
          messages={[errors.price?.message, errors.unit?.message]}
        />
      </div>
    </div>
  );
};

export default ServiceFields;
