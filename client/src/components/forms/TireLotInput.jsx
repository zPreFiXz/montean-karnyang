import { useEffect, useRef, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import FieldErrorList from "@/components/forms/FieldErrorList";
import CollapsibleRow from "@/components/ui/CollapsibleRow";
import { scrollToNewRow } from "@/utils/scrollToNewRow";

// allowEmpty: ยางที่ขายหมดไม่มีล็อตเหลือ (backend ลบทิ้ง) ต้องยอมให้ไม่มีแถว ไม่งั้นแก้ราคาไม่ได้
const TireLotInput = ({
  control,
  register,
  watch,
  errors,
  allowEmpty,
  unit: unitProp,
  heading = "สัปดาห์/ปีผลิต",
  headingClass = "text-xl",
  className = "mt-4 px-5",
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "tireLots",
  });
  const [leavingId, setLeavingId] = useState(null);
  const rowRefs = useRef([]);

  // เตรียมแถวว่างไว้ให้ (หน้าแก้ไขโหลดข้อมูลเสร็จก่อนคอมโพเนนต์ถูกวาด แถวเดิมจึงครบแล้ว)
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    if (fields.length === 0 && !allowEmpty) {
      append({ dotCode: "", quantity: "" }, { shouldFocus: false });
    }
  }, [fields.length, append, allowEmpty]);

  const lots = watch("tireLots") || [];
  // หน้าเพิ่ม/แก้ไขรายการมีช่องหน่วยอยู่ในฟอร์ม ส่วนไดอะล็อกเพิ่มสต็อกไม่มี จึงส่งมาทาง prop แทน
  const unit = unitProp ?? watch("unit");
  const total = lots.reduce(
    (sum, lot) => sum + (Number(lot?.quantity) || 0),
    0,
  );
  const lotErrors = errors?.tireLots;

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <p className={`text-subtle-dark font-medium ${headingClass}`}>
          {heading}
        </p>
        <p className={`text-subtle-dark font-medium ${headingClass}`}>
          รวม {total} {unit}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {fields.map((field, index) => {
          const rowError = lotErrors?.[index];
          return (
            <CollapsibleRow
              key={field.id}
              leaving={leavingId === field.id}
              onLeaveEnd={() => {
                remove(index);
                setLeavingId(null);
              }}
            >
              <div
                ref={(el) => (rowRefs.current[index] = el)}
                className="flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <Input
                    {...register(`tireLots.${index}.dotCode`)}
                    type="text"
                    inputMode="numeric"
                    placeholder="เช่น 0126"
                    aria-label={`สัปดาห์/ปีผลิตรายการที่ ${index + 1}`}
                    onInput={(e) => {
                      e.target.value = e.target.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 4);
                    }}
                    className={`bg-surface h-[41px] flex-1 rounded-[20px] px-3 text-xl font-medium placeholder:text-lg placeholder:font-light md:text-[22px] md:placeholder:text-xl ${
                      rowError?.dotCode
                        ? "border-destructive focus-visible:!border-destructive focus-visible:!ring-destructive/30 focus-visible:!border-2"
                        : "focus-visible:!border-primary focus-visible:!ring-primary/35 focus-visible:!border-2"
                    }`}
                  />
                  <Input
                    {...register(`tireLots.${index}.quantity`)}
                    type="text"
                    inputMode="numeric"
                    // ช่องนี้ไม่มีหัวข้อ placeholder จึงทำหน้าที่เป็นป้ายชื่อคอลัมน์
                    placeholder="จำนวน"
                    aria-label={`จำนวนรายการที่ ${index + 1}`}
                    onInput={(e) => {
                      e.target.value = e.target.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 4);
                    }}
                    className={`bg-surface h-[41px] w-22.5 rounded-[20px] px-3 text-xl font-medium placeholder:text-lg placeholder:font-light md:text-[22px] md:placeholder:text-xl ${
                      rowError?.quantity
                        ? "border-destructive focus-visible:!border-destructive focus-visible:!ring-destructive/30 focus-visible:!border-2"
                        : "focus-visible:!border-primary focus-visible:!ring-primary/35 focus-visible:!border-2"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setLeavingId(field.id)}
                    disabled={fields.length === 1 && !allowEmpty}
                    aria-label={`ลบรายการที่ ${index + 1}`}
                    className="text-destructive hover:bg-destructive/10 flex h-[41px] w-[41px] shrink-0 cursor-pointer items-center justify-center rounded-[20px] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                {/* แถวเดียวผิดได้พร้อมกันทั้งสองช่อง ถ้าโชว์ข้อความเดียวจะมีช่องแดงที่ไม่มีคำอธิบาย */}
                <FieldErrorList
                  messages={[
                    rowError?.dotCode?.message,
                    rowError?.quantity?.message,
                  ]}
                />
              </div>
            </CollapsibleRow>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => {
          append({ dotCode: "", quantity: "" });
          scrollToNewRow(() => rowRefs.current[fields.length]);
        }}
        className="text-subtle-light mt-3 flex h-[41px] w-full cursor-pointer items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-gray-300 text-lg font-medium transition-colors duration-200 hover:border-gray-400 hover:bg-gray-50 md:text-xl"
      >
        <Plus className="h-5 w-5" />
        เพิ่มรายการ
      </button>
    </div>
  );
};
export default TireLotInput;
