import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import FormInput from "@/components/forms/FormInput";

// เบอร์ข้างรถที่บริษัทเจ้าของรถตั้งไว้ รถส่วนใหญ่ไม่มี จึงซ่อนช่องไว้หลังปุ่ม
const FleetNoField = ({ register, errors, value, onClear }) => {
  const [isOpen, setIsOpen] = useState(!!value);

  // กางค้างไว้เมื่อมีค่า ลบข้อความจนว่างระหว่างพิมพ์ ช่องจะได้ไม่หายไปต่อหน้า
  useEffect(() => {
    if (value) setIsOpen(true);
  }, [value]);

  // ซ่อนแล้วล้างเบอร์ทิ้ง ไม่งั้นเบอร์ที่มองไม่เห็นจะถูกบันทึกไปด้วย
  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      onClear?.();
      return;
    }
    setIsOpen(true);
    // รอให้ช่องเลิก inert ก่อนถึงจะโฟกัสได้
    requestAnimationFrame(() =>
      document.getElementById("fleetNo")?.focus({ preventScroll: true }),
    );
  };

  const Icon = isOpen ? Minus : Plus;

  return (
    <>
      <div className="flex justify-center px-5 pt-1">
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={isOpen}
          className="text-surface/70 xl:text-subtle-dark flex h-10 cursor-pointer items-center gap-1.5 px-3 text-lg font-semibold md:text-xl"
        >
          <Icon className="h-4 w-4" />
          {isOpen ? "ลบเบอร์รถ" : "เพิ่มเบอร์รถ"}
        </button>
      </div>

      <div
        inert={!isOpen}
        className={`grid transition-all duration-200 motion-reduce:transition-none ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
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
              customClass="px-5"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default FleetNoField;
