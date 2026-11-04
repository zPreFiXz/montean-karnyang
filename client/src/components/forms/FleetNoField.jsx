import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
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

  // ปุ่มยุบพร้อมกับที่ช่องกาง ความเร็วเดียวกัน ความสูงรวมจึงเปลี่ยนต่อเนื่อง ของด้านล่างไม่กระตุก
  const collapse = (show) =>
    `grid transition-all duration-200 motion-reduce:transition-none ${
      show ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
    }`;

  return (
    <>
      {/* ช่องอยู่เหนือปุ่ม ระหว่างปุ่มยุบ ช่องจะกางลงมาจากด้านบน ไม่ถูกดึงขึ้นมาจากข้างล่าง */}
      <div inert={!isOpen} className={collapse(isOpen)}>
        <div className="overflow-hidden">
          {/* ปุ่มลบอยู่ขวาหัวข้อช่อง ติดกับสิ่งที่ลบ */}
          <div className="mt-4 flex items-center justify-between px-5">
            <label
              htmlFor="fleetNo"
              className="text-surface xl:text-subtle-dark text-xl font-medium"
            >
              เบอร์รถ
            </label>
            <button
              type="button"
              onClick={handleToggle}
              aria-expanded={isOpen}
              // ทรงเดียวกับปุ่ม "ล้างข้อมูล" หัวหน้า บนพื้นน้ำเงินตัวแดงอ่านยากจึงมีพื้นขาว
              className="text-destructive bg-surface flex shrink-0 cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-lg font-medium duration-300 md:text-xl xl:bg-transparent xl:px-0"
            >
              <X className="h-4 w-4" />
              ลบเบอร์รถ
            </button>
          </div>
          <FormInput
            register={register}
            name="fleetNo"
            type="text"
            placeholder="เช่น 12"
            color="surface"
            errors={errors}
            maxLength={20}
            customClass="px-5"
          />
        </div>
      </div>
      {/* ปุ่มเส้นประแบบ "เพิ่มรถรุ่นอื่น" ในหน้าสต็อก มือถืออยู่บนพื้นน้ำเงิน จอใหญ่อยู่บนพื้นขาว */}
      <div inert={isOpen} className={collapse(!isOpen)}>
        <div className="overflow-hidden">
          <div className="mt-4 px-5">
            <button
              type="button"
              onClick={handleToggle}
              aria-expanded={false}
              className="text-surface border-surface/60 xl:text-subtle-light flex h-[41px] w-full cursor-pointer items-center justify-center gap-2 rounded-[20px] border-2 border-dashed text-lg font-medium duration-200 md:text-xl xl:border-gray-300 xl:hover:border-gray-400 xl:hover:bg-gray-50"
            >
              <Plus className="h-5 w-5" />
              เพิ่มเบอร์รถ
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FleetNoField;
