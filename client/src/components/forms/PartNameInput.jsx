import { useEffect, useRef, useState } from "react";
import FormInput from "@/components/forms/FormInput";
import { nameSuggestionsOf } from "@/utils/partHints";

// ช่องชื่ออะไหล่ที่แนะนำจากของเดิมในหมวด (ดู nameSuggestionsOf) แบบเดียวกับช่องชื่อลูกค้า
// อะไหล่เลือกชนิดแล้วพิมพ์รุ่นรถต่อ ยางเลือกรุ่นทั้งชื่อ
const PartNameInput = ({
  register,
  errors,
  setValue,
  value,
  hints,
  isTire,
  brand,
  label,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const suggestions = nameSuggestionsOf(hints, {
    isTire,
    brand,
    typed: value,
  });

  // ใช้ pointerdown ให้ปิดก่อนโฟกัสย้ายไปช่องถัดไป
  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const handleSelect = (text) => {
    setValue("name", isTire ? text : `${text} `, { shouldValidate: true });
    setIsOpen(false);
    // อะไหล่ต้องพิมพ์รุ่นรถต่อ คืนโฟกัสให้ช่องเดิม
    if (!isTire) document.getElementById("name")?.focus();
  };

  const { onChange, ...field } = register("name");

  return (
    <div ref={containerRef} className="relative">
      <FormInput
        register={() => ({
          ...field,
          onChange: (event) => {
            setIsOpen(true);
            return onChange(event);
          },
        })}
        name="name"
        label={label}
        type="text"
        placeholder={placeholder}
        color="subtle-dark"
        errors={errors}
        autoComplete="off"
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && suggestions.length > 0 && (
        <ul className="bg-surface shadow-primary absolute top-full right-5 left-5 z-30 mt-1 max-h-60 overflow-y-auto rounded-lg py-1">
          {suggestions.map((text) => (
            <li key={text}>
              <button
                type="button"
                onClick={() => handleSelect(text)}
                className="w-full cursor-pointer px-3 py-2 text-left hover:bg-gray-100"
              >
                <p className="text-normal truncate text-lg font-medium md:text-xl">
                  {text}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PartNameInput;
