import FormInput from "@/components/forms/FormInput";
import FieldErrorList from "@/components/forms/FieldErrorList";
import TireConstructionToggle from "@/components/forms/TireConstructionToggle";

const TireSizeFields = ({ register, watch, setValue, errors }) => (
  <div className="mt-[16px] px-[20px]">
    <div className="flex items-end gap-[8px]">
      <FormInput
        register={register}
        name="width"
        label="หน้ายาง"
        type="text"
        placeholder="มม."
        color="subtle-dark"
        customClass="w-full min-w-0 flex-1"
        errors={errors}
        hideErrorMessage
        inputMode="decimal"
        onWheel={(e) => e.target.blur()}
        onInput={(e) => {
          // ยางบรรทุกใช้หน่วยนิ้วและมีจุดทศนิยม (7.50R16)
          // ต่างจากยางเก๋งที่เป็นมิลลิเมตรจำนวนเต็ม (195/55R15)
          e.target.value = e.target.value
            .replace(/[^0-9.]/g, "")
            .replace(/(\..*)\./g, "$1")
            .slice(0, 5);
        }}
      />

      {/* ยางบรรทุกไม่มีแก้มยาง (7.50R16) ตัวคั่นจึงไม่ควรค้างอยู่เมื่อช่องกลางว่าง */}
      <span
        className={`text-subtle-dark flex h-[41px] shrink-0 items-center text-xl font-medium md:text-[22px] ${
          watch("aspectRatio") ? "" : "opacity-0"
        }`}
      >
        /
      </span>

      <FormInput
        register={register}
        name="aspectRatio"
        label="แก้มยาง"
        type="text"
        placeholder="%"
        color="subtle-dark"
        customClass="w-full min-w-0 flex-1"
        errors={errors}
        hideErrorMessage
        inputMode="numeric"
        onWheel={(e) => e.target.blur()}
        onInput={(e) => {
          e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
        }}
      />

      <TireConstructionToggle
        value={watch("construction")}
        onChange={(next) => setValue("construction", next)}
      />

      <FormInput
        register={register}
        name="rimDiameter"
        label="ขอบ"
        type="text"
        placeholder="นิ้ว"
        color="subtle-dark"
        customClass="w-full min-w-0 flex-1"
        errors={errors}
        hideErrorMessage
        inputMode="numeric"
        onWheel={(e) => e.target.blur()}
        onInput={(e) => {
          e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
        }}
      />
    </div>

    <FieldErrorList
      className="mt-[6px]"
      messages={[
        errors.width?.message,
        errors.aspectRatio?.message,
        errors.rimDiameter?.message,
      ]}
    />
  </div>
);

export default TireSizeFields;
