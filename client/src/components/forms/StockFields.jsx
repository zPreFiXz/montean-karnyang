import FormInput from "@/components/forms/FormInput";
import FieldErrorList from "@/components/forms/FieldErrorList";
import TireLotInput from "@/components/forms/TireLotInput";

// ยางไม่มีช่องจำนวนสต็อก (คิดจากผลรวมล็อต) สต็อกขั้นต่ำจึงอยู่เต็มแถวไปเลย
const StockFields = ({
  lotTracked,
  allowEmptyLots,
  control,
  register,
  watch,
  errors,
}) => {
  if (lotTracked) {
    return (
      <>
        <TireLotInput
          control={control}
          register={register}
          watch={watch}
          errors={errors}
          allowEmpty={allowEmptyLots}
        />
        <FormInput
          register={register}
          name="minStockLevel"
          label="สต็อกขั้นต่ำ"
          type="number"
          placeholder="เช่น 3"
          color="subtle-dark"
          errors={errors}
          inputMode="numeric"
          onWheel={(e) => e.target.blur()}
          onInput={(e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, "");
          }}
        />
      </>
    );
  }

  return (
    <div className="mt-[16px] px-[20px]">
      <div className="grid grid-cols-2 gap-[8px]">
        <FormInput
          register={register}
          name="stockQuantity"
          label="จำนวนสต็อก"
          type="number"
          placeholder="เช่น 10"
          color="subtle-dark"
          customClass="w-full"
          errors={errors}
          hideErrorMessage
          inputMode="numeric"
          onWheel={(e) => e.target.blur()}
          onInput={(e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, "");
          }}
        />

        <FormInput
          register={register}
          name="minStockLevel"
          label="สต็อกขั้นต่ำ"
          type="number"
          placeholder="เช่น 3"
          color="subtle-dark"
          customClass="w-full"
          errors={errors}
          hideErrorMessage
          inputMode="numeric"
          onWheel={(e) => e.target.blur()}
          onInput={(e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, "");
          }}
        />
      </div>

      <FieldErrorList
        className="mt-[6px]"
        messages={[
          errors.stockQuantity?.message,
          errors.minStockLevel?.message,
        ]}
      />
    </div>
  );
};

export default StockFields;
