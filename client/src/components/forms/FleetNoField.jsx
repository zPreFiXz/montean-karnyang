import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import FormInput from "@/components/forms/FormInput";

// เบอร์ที่บริษัทเจ้าของรถตั้งไว้ข้างรถ ช่างกับฝ่ายบัญชีของบริษัทเรียกรถด้วยเบอร์นี้ ไม่ใช่ทะเบียน
// รถส่วนใหญ่ไม่มีเบอร์ จึงซ่อนช่องไว้หลังปุ่มเล็ก ฟอร์มจะได้ไม่รกทุกบิล
// รถที่มีเบอร์อยู่แล้ว (เติมจากรถคันเดิม หรือเปิดแก้ไขบิล) กางช่องให้เห็นเลย
const FleetNoField = ({ register, errors, value }) => {
  const [isOpen, setIsOpen] = useState(!!value);

  // กางค้างไว้เมื่อมีค่า ลบข้อความจนว่างระหว่างพิมพ์ ช่องจะได้ไม่หายไปต่อหน้า
  useEffect(() => {
    if (value) setIsOpen(true);
  }, [value]);

  const handleOpen = () => {
    setIsOpen(true);
    // กดปุ่มเพิ่มแล้วพิมพ์ต่อได้เลย ไม่ต้องแตะช่องอีกครั้ง (รอให้ช่องเลิก inert ก่อนถึงจะโฟกัสได้)
    requestAnimationFrame(() =>
      document.getElementById("fleetNo")?.focus({ preventScroll: true }),
    );
  };

  // ปุ่มยุบลงพร้อมกับช่องกางออก ความสูงรวมเปลี่ยนแบบค่อยเป็นค่อยไป ไม่กระตุก
  // grid-rows 0fr→1fr และจังหวะ 200ms เท่ากับกล่องข้อมูลลูกค้าในหน้าเดียวกัน
  const slide = (isShown, duration = "duration-200") =>
    `grid transition-all ${duration} motion-reduce:transition-none ${
      isShown ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
    }`;

  return (
    <>
      <div
        inert={isOpen}
        // ปุ่มหายเร็วกว่าช่องที่เลื่อนลงมา จะได้เห็นช่องมาแทนที่ ไม่ซ้อนกันกลางทาง
        className={slide(!isOpen, isOpen ? "duration-100" : "duration-200")}
      >
        <div className="overflow-hidden">
          {/* ใช้ไม่บ่อย จึงเป็นแค่ข้อความสีจางกลางแผ่น ไม่มีกรอบให้แย่งสายตาจากช่องที่ต้องกรอกทุกบิล
              แต่พื้นที่กดยังสูง 40 จุดเท่าเป้านิ้วมาตรฐาน แตะใกล้ๆ ก็โดน */}
          <div className="flex justify-center px-[20px] pt-[4px]">
            <button
              type="button"
              onClick={handleOpen}
              className="text-surface/70 xl:text-subtle-dark flex h-[40px] cursor-pointer items-center gap-[6px] px-[12px] text-lg font-semibold md:text-xl"
            >
              <Plus className="h-4 w-4" />
              เพิ่มเบอร์รถ
            </button>
          </div>
        </div>
      </div>

      <div inert={!isOpen} className={slide(isOpen)}>
        <div className="overflow-hidden">
          {/* ช่องเลื่อนลงมาจากด้านบน (ใต้ปุ่มที่กำลังหาย) ไม่ใช่โผล่ขึ้นมาจากข้างล่าง */}
          <div
            className={`transition-transform duration-200 motion-reduce:transition-none ${
              isOpen ? "translate-y-0" : "-translate-y-full"
            }`}
          >
            <FormInput
              register={register}
              name="fleetNo"
              label="เบอร์รถ"
              type="text"
              placeholder="เช่น 12"
              color="surface"
              errors={errors}
              maxLength={20}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default FleetNoField;
