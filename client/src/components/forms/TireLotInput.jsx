import { useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

// ปียาง: แต่ละแถวคือ DOT (สัปดาห์/ปีผลิต 4 หลัก) + จำนวน — สต็อกรวม = ผลรวมทุกแถว
const TireLotInput = ({ control, register, watch, errors }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "tireLots",
  });

  const lots = watch("tireLots") || [];
  const total = lots.reduce(
    (sum, lot) => sum + (Number(lot?.quantity) || 0),
    0,
  );
  const lotErrors = errors?.tireLots;

  return (
    <div className="mt-[16px] px-[20px]">
      <div className="mb-[8px] flex items-center justify-between">
        <p className="text-subtle-dark text-lg font-medium md:text-xl">ปียาง</p>
        <p className="text-subtle-dark text-base font-medium md:text-lg">
          รวม {total} เส้น
        </p>
      </div>

      <div className="flex flex-col gap-[12px]">
        {fields.map((field, index) => {
          const rowError = lotErrors?.[index];
          return (
            <div key={field.id} className="flex flex-col gap-[4px]">
              <div className="flex items-center gap-[8px]">
                <input
                  {...register(`tireLots.${index}.dotCode`)}
                  type="text"
                  inputMode="numeric"
                  placeholder="ปียาง เช่น 0126"
                  aria-label={`ปียางรายการที่ ${index + 1}`}
                  onInput={(e) => {
                    e.target.value = e.target.value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 4);
                  }}
                  className={`bg-surface h-[41px] flex-1 rounded-[12px] border px-[12px] text-lg font-medium md:text-xl ${
                    rowError?.dotCode
                      ? "border-destructive"
                      : "border-subtle-light"
                  }`}
                />
                <input
                  {...register(`tireLots.${index}.quantity`)}
                  type="text"
                  inputMode="numeric"
                  placeholder="จำนวน"
                  aria-label={`จำนวนรายการที่ ${index + 1}`}
                  onInput={(e) => {
                    e.target.value = e.target.value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 4);
                  }}
                  className={`bg-surface h-[41px] w-[90px] rounded-[12px] border px-[12px] text-lg font-medium md:text-xl ${
                    rowError?.quantity
                      ? "border-destructive"
                      : "border-subtle-light"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`ลบรายการที่ ${index + 1}`}
                  className="text-destructive hover:bg-destructive/10 flex h-[41px] w-[41px] shrink-0 cursor-pointer items-center justify-center rounded-[12px] transition-colors duration-200"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              {(rowError?.dotCode || rowError?.quantity) && (
                <p className="text-destructive px-[4px] text-base font-medium">
                  {rowError?.dotCode?.message || rowError?.quantity?.message}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {typeof lotErrors?.message === "string" && (
        <p className="text-destructive mt-[8px] px-[4px] text-base font-medium md:text-lg">
          {lotErrors.message}
        </p>
      )}

      <button
        type="button"
        onClick={() => append({ dotCode: "", quantity: "" })}
        className="text-subtle-light mt-[12px] flex h-[41px] w-full cursor-pointer items-center justify-center gap-[8px] rounded-[12px] border-2 border-dashed border-gray-300 text-lg font-medium transition-colors duration-200 hover:border-gray-400 hover:bg-gray-50 md:text-xl"
      >
        <Plus className="h-5 w-5" />
        เพิ่มปียาง
      </button>
    </div>
  );
};
export default TireLotInput;
