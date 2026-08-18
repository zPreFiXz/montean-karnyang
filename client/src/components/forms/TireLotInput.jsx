import { useEffect, useRef, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "../ui/input";
import FieldErrorList from "./FieldErrorList";
import CollapsibleRow from "../ui/CollapsibleRow";
import { scrollToNewRow } from "@/utils/scrollToNewRow";

// สัปดาห์/ปีผลิต: แต่ละแถวคือ DOT (WWYY 4 หลัก) + จำนวน — สต็อกรวม = ผลรวมทุกแถว
// allowEmpty: ยางที่ขายหมดแล้วไม่มีล็อตเหลืออยู่จริง (backend ลบล็อตทิ้งเมื่อตัดสต็อกจนหมด)
// จึงต้องยอมให้ไม่มีแถวเลย ไม่งั้นจะแก้ราคาหรือชื่อรุ่นไม่ได้จนกว่าจะกรอก DOT ปลอม
const TireLotInput = ({
  control,
  register,
  watch,
  errors,
  allowEmpty,
  unit: unitProp,
  heading = "สัปดาห์/ปีผลิต",
  // ค่าเริ่มต้นเท่ากับหัวข้อช่องอื่นในฟอร์มหน้าเต็ม ไดอะล็อกใช้ขนาดเล็กกว่าจึงส่งมาทับ
  headingClass = "text-xl",
  className = "mt-[16px] px-[20px]",
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "tireLots",
  });
  // แถวที่กำลังยุบตัวก่อนหายจริง (ดู CollapsibleRow)
  const [leavingId, setLeavingId] = useState(null);
  const rowRefs = useRef([]);

  // ปกติบังคับอย่างน้อย 1 แถว จึงเตรียมแถวว่างไว้ให้เลย ผู้ใช้จะได้ไม่เจอ
  // "กรุณาเพิ่มอย่างน้อย 1 รายการ" ทั้งที่ยังไม่มีอะไรให้กรอก
  // (หน้าแก้ไขโหลดข้อมูลเสร็จก่อนคอมโพเนนต์นี้ถูกวาด แถวเดิมจึงอยู่ครบแล้ว ไม่งอกเกิน)
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
      <div className="mb-[8px] flex items-center justify-between">
        <p className={`text-subtle-dark font-medium ${headingClass}`}>
          {heading}
        </p>
        <p className={`text-subtle-dark font-medium ${headingClass}`}>
          รวม {total} {unit}
        </p>
      </div>

      <div className="flex flex-col gap-[12px]">
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
                className="flex flex-col gap-[4px]"
              >
                <div className="flex items-center gap-[8px]">
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
                    className={`bg-surface h-[41px] flex-1 rounded-[20px] px-[12px] text-xl font-medium placeholder:text-lg placeholder:font-light md:text-[22px] md:placeholder:text-xl ${
                      rowError?.dotCode
                        ? "border-destructive focus-visible:!border-destructive focus-visible:!ring-destructive/30 focus-visible:!border-2"
                        : "focus-visible:!border-primary focus-visible:!ring-primary/35 focus-visible:!border-2"
                    }`}
                  />
                  <Input
                    {...register(`tireLots.${index}.quantity`)}
                    type="text"
                    inputMode="numeric"
                    // ข้อยกเว้นของธรรมเนียม "เช่น ..." — ช่องนี้ไม่มีหัวข้อกำกับ
                    // placeholder จึงต้องทำหน้าที่เป็นป้ายชื่อคอลัมน์แทน
                    placeholder="จำนวน"
                    aria-label={`จำนวนรายการที่ ${index + 1}`}
                    onInput={(e) => {
                      e.target.value = e.target.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 4);
                    }}
                    className={`bg-surface h-[41px] w-[90px] rounded-[20px] px-[12px] text-xl font-medium placeholder:text-lg placeholder:font-light md:text-[22px] md:placeholder:text-xl ${
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
        className="text-subtle-light mt-[12px] flex h-[41px] w-full cursor-pointer items-center justify-center gap-[8px] rounded-[20px] border-2 border-dashed border-gray-300 text-lg font-medium transition-colors duration-200 hover:border-gray-400 hover:bg-gray-50 md:text-xl"
      >
        <Plus className="h-5 w-5" />
        เพิ่มรายการ
      </button>
    </div>
  );
};
export default TireLotInput;
