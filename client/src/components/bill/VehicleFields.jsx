import ComboBox from "@/components/ui/ComboBox";
import FormInput from "@/components/forms/FormInput";
import LicensePlateInput from "@/components/forms/LicensePlateInput";
import KnownVehicleHint from "@/components/forms/KnownVehicleHint";
import FleetNoField from "@/components/forms/FleetNoField";
import { provinces } from "@/constants/provinces";

// ช่องข้อมูลรถ (ยี่ห้อ รุ่น ทะเบียน เบอร์รถ เลขกิโลเมตร) ใช้ทั้งหน้ากรอกบิลและหน้าเช็กช่วงล่าง
// fleetKey เปลี่ยนเมื่อล้างฟอร์ม ช่องเบอร์รถจะยุบกลับเป็นปุ่มเล็กเหมือนฟอร์มใหม่
const VehicleFields = ({
  register,
  errors,
  watch,
  setValue,
  brands,
  modelOptions,
  plateText,
  excludeRepairId,
  fleetKey,
}) => (
  <>
    <div className="mt-[16px] px-[20px]">
      <ComboBox
        label="ยี่ห้อรถ"
        color="text-surface"
        options={brands}
        value={watch("brand")}
        onChange={(value) => {
          setValue("brand", value, {
            shouldValidate: true,
            shouldTouch: true,
          });
          setValue("model", "", {
            shouldValidate: true,
            shouldTouch: true,
          });
        }}
        placeholder="-- เลือกยี่ห้อรถ --"
        errors={errors}
        name="brand"
      />
      <input
        {...register("brand")}
        type="hidden"
        value={watch("brand") || ""}
      />
    </div>
    <div className="mt-[16px] px-[20px]">
      <ComboBox
        label="รุ่นรถ"
        color="text-surface"
        options={modelOptions}
        value={watch("model")}
        onChange={(value) =>
          setValue("model", value, {
            shouldValidate: true,
            shouldTouch: true,
          })
        }
        placeholder="-- เลือกรุ่นรถ --"
        errors={errors}
        name="model"
        disabled={!watch("brand")}
      />
      <input
        {...register("model")}
        type="hidden"
        value={watch("model") || ""}
      />
    </div>
    <div className="px-[20px] pt-[16px]">
      <p className="text-surface mb-[8px] text-xl font-medium">ทะเบียนรถ</p>
      <div className="flex items-start gap-[8px]">
        <div className="w-[70px]">
          <LicensePlateInput
            register={register}
            name="plateLetters"
            placeholder="กก"
            maxLength={3}
            error={errors.plateLetters}
            onInput={(e) => {
              e.target.value = e.target.value
                .replace(/[^ก-ฮ0-9]/g, "")
                .slice(0, 3);
            }}
          />
        </div>
        <div className="w-[80px]">
          <LicensePlateInput
            register={register}
            name="plateNumbers"
            placeholder="1234"
            maxLength={4}
            error={errors.plateNumbers}
            onInput={(e) => {
              e.target.value = e.target.value
                .replace(/[^0-9]/g, "")
                .slice(0, 4);
            }}
          />
        </div>
        <div className="flex-1">
          <ComboBox
            label=""
            color="text-surface"
            options={provinces}
            value={provinces.find((p) => p.name === watch("province"))?.id}
            onChange={(value) => {
              const provinceName =
                provinces.find((p) => p.id === value)?.name || value;
              setValue("province", provinceName, {
                shouldValidate: true,
                shouldTouch: true,
              });
            }}
            placeholder="-- เลือกจังหวัด --"
            errors={errors}
            name="province"
          />
        </div>
      </div>
      <KnownVehicleHint
        plate={plateText}
        brand={watch("brand")}
        model={watch("model")}
        province={watch("province")}
        excludeRepairId={excludeRepairId}
      />
    </div>

    <FleetNoField
      key={fleetKey}
      register={register}
      errors={errors}
      value={watch("fleetNo")}
      onClear={() => setValue("fleetNo", "", { shouldValidate: true })}
    />

    <FormInput
      register={register}
      name="mileage"
      label="เลขกิโลเมตร"
      type="number"
      placeholder="เช่น 120000"
      color="surface"
      errors={errors}
      inputMode="numeric"
      onWheel={(e) => e.target.blur()}
      onInput={(e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, "");
      }}
    />
  </>
);

export default VehicleFields;
