import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import FormInput from "@/components/forms/FormInput";
import { listCustomers } from "@/api/customer";

// ช่องชื่อลูกค้าที่มีรายการที่เคยบันทึกไว้ขึ้นมาให้เลือก แต่ยังพิมพ์ชื่อใหม่ได้อิสระ
// ไม่ใช่ดรอปดาวน์ที่บังคับเลือก เพราะลูกค้าใหม่ต้องกรอกได้เสมอ
const CustomerNameInput = ({ register, errors, value, onSelect }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  // กันไม่ให้รายการเด้งขึ้นมาอีกทันทีหลังเพิ่งเลือกไป (ค่าในช่องเปลี่ยน = ทริกเกอร์ค้นหาใหม่)
  const skipNextSearch = useRef(false);

  const search = useDebouncedCallback(async (term) => {
    try {
      const res = await listCustomers(term);
      setSuggestions(res.data || []);
      setIsOpen((res.data || []).length > 0);
    } catch {
      // ค้นไม่ได้ก็แค่ไม่มีรายการแนะนำ ยังพิมพ์เองได้ตามปกติ
      setSuggestions([]);
      setIsOpen(false);
    }
  }, 300);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    const term = (value || "").trim();
    if (!term) {
      search.cancel();
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    search(term);
  }, [value, search]);

  // ปิดรายการเมื่อคลิกที่อื่น — ใช้ pointerdown เพื่อให้ปิดก่อนโฟกัสย้ายไปช่องถัดไป
  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const handleSelect = (customer) => {
    skipNextSearch.current = true;
    setIsOpen(false);
    onSelect(customer);
  };

  return (
    <div ref={containerRef} className="relative">
      <FormInput
        register={register}
        name="name"
        label="ชื่อลูกค้า"
        type="text"
        placeholder="เช่น สมชาย ใจดี"
        color="subtle-dark"
        errors={errors}
        customClass="w-full"
        autoComplete="off"
        onFocus={() => setIsOpen(suggestions.length > 0)}
      />

      {isOpen && (
        <ul className="bg-surface shadow-primary absolute top-full right-0 left-0 z-30 mt-[4px] max-h-[240px] overflow-y-auto rounded-[10px] py-[4px]">
          {suggestions.map((customer) => (
            <li key={customer.id}>
              <button
                type="button"
                onClick={() => handleSelect(customer)}
                className="w-full cursor-pointer px-[12px] py-[8px] text-left hover:bg-gray-100"
              >
                <p className="text-normal truncate text-lg font-medium md:text-xl">
                  {customer.name || "ไม่ระบุชื่อ"}
                </p>
                {customer.phoneNumber && (
                  <p className="text-subtle-dark truncate text-base md:text-lg">
                    {customer.phoneNumber}
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomerNameInput;
