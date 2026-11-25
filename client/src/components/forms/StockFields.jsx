import FormInput from "@/components/forms/FormInput";
import FieldErrorList from "@/components/forms/FieldErrorList";
import TireLotInput from "@/components/forms/TireLotInput";
import { quantityInputProps } from "@/utils/numberInput";

// ยางไม่มีช่องจำนวนสต็อก (คิดจากผลรวมล็อต) สต็อกขั้นต่ำจึงอยู่เต็มแถวไปเลย
// onToggleUnlimited ไม่ส่งมา = ตั้งไม่จำกัดไม่ได้ (ยาง)
const StockFields = ({
  lotTracked,
  unlimited = false,
  onToggleUnlimited,
  allowEmptyLots,
  allowDecimal = false,
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
    <div className="mt-4 px-5">
      {/* สวิตช์แบบเดียวกับ "บันทึกราคาต้นทุนใหม่" ในหน้าต่างพิมพ์ฉลาก */}
      {onToggleUnlimited && (
        <button
          type="button"
          role="switch"
          aria-checked={unlimited}
          onClick={onToggleUnlimited}
          className={`font-athiti flex cursor-pointer items-center gap-2 text-left ${unlimited ? "" : "mb-2"}`}
        >
          <span
            className={`flex h-5.5 w-9.5 shrink-0 items-center rounded-full p-[3px] transition-colors duration-300 ${
              unlimited ? "bg-primary" : "bg-gray-300"
            }`}
          >
            <span
              className={`bg-surface h-4 w-4 rounded-full transition-transform duration-300 ${
                unlimited ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </span>
          <span
            className={`text-lg font-medium md:text-xl ${
              unlimited ? "text-primary" : "text-subtle-dark"
            }`}
          >
            ไม่นับสต็อก
          </span>
        </button>
      )}
      {!unlimited && (
        <div className="grid grid-cols-2 gap-2">
          <FormInput
            register={register}
            name="stockQuantity"
            label="จำนวนสต็อก"
            placeholder={allowDecimal ? "เช่น 3.5" : "เช่น 10"}
            color="subtle-dark"
            customClass="w-full"
            errors={errors}
            hideErrorMessage
            onWheel={(e) => e.target.blur()}
            {...quantityInputProps(allowDecimal)}
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
      )}

      <FieldErrorList
        className="mt-1.5"
        messages={[
          errors.stockQuantity?.message,
          errors.minStockLevel?.message,
        ]}
      />
    </div>
  );
};

export default StockFields;
