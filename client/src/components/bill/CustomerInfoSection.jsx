import { ChevronDown, ContactRound } from "lucide-react";
import CustomerNameInput from "@/components/forms/CustomerNameInput";
import FormInput from "@/components/forms/FormInput";
import { formatPhone } from "@/utils/formats";

// กล่องข้อมูลลูกค้าแบบพับได้ ใช้ทั้งหน้ากรอกบิลและหน้าเช็กช่วงล่าง
// ฟอร์มเป็นของหน้าที่เรียกใช้ (react-hook-form) กล่องนี้แค่วาดช่องและส่งค่าที่เลือกกลับไป
const CustomerInfoSection = ({
  register,
  errors,
  watch,
  isOpen,
  onToggle,
  onSelectCustomer,
}) => (
  <div className="bg-surface mx-[20px] mt-[16px] overflow-hidden rounded-[10px]">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls="customer-info-panel"
      className="focus-visible:ring-primary/50 flex w-full cursor-pointer items-center justify-between px-[16px] py-[12px] outline-none focus-visible:ring-2 focus-visible:ring-inset"
    >
      <div className="flex items-center gap-[12px]">
        <div className="bg-primary/10 flex h-[40px] w-[40px] items-center justify-center rounded-full">
          <ContactRound className="text-primary h-6 w-6" />
        </div>
        {/* ความสูงคงที่ ไม่งั้นหัวข้อจะขยับตอนพิมพ์ชื่อ — ไม่มีชื่อก็ให้หัวข้ออยู่กลางแทน */}
        <div className="flex min-h-[56px] flex-col justify-center text-left">
          <p className="text-normal text-xl font-medium">ข้อมูลลูกค้า</p>
          {/* กรอกแต่เบอร์ไม่กรอกชื่อก็ยังบอกได้ว่าเก็บอะไรไว้แล้ว
                เบอร์เลื่อนขึ้นมาแทนที่ชื่อ ไม่ใช่ห้อยจุดคั่นไว้ข้างหน้าลอยๆ */}
          {(watch("name") || watch("phoneNumber")) && (
            <p className="text-subtle-dark line-clamp-1 text-lg md:text-xl">
              {watch("name")}
              {watch("name") && watch("phoneNumber") && " • "}
              {watch("phoneNumber") && formatPhone(watch("phoneNumber"))}
            </p>
          )}
        </div>
      </div>
      <ChevronDown
        className={`text-subtle-dark h-6 w-6 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
      />
    </button>

    {/* ข้อมูลลูกค้า ที่ซ่อน/แสดง */}
    <div
      inert={!isOpen}
      // grid-rows 0fr→1fr ขยายไปหาความสูงจริง ไม่ต้องเดาเป็นตัวเลข
      // (max-h ตายตัวจะตัดเนื้อหาทิ้งเมื่อทุกช่องขึ้นข้อความ error พร้อมกัน)
      id="customer-info-panel"
      className={`grid transition-all duration-200 motion-reduce:transition-none ${
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="overflow-hidden">
        <div className="space-y-[12px] px-[16px] pb-[16px]">
          <CustomerNameInput
            register={register}
            errors={errors}
            value={watch("name")}
            onSelect={onSelectCustomer}
          />

          <FormInput
            register={register}
            name="address"
            label="ที่อยู่"
            rows={2}
            placeholder="เช่น 543 หมู่ 5 ต.น้ำอ้อม อ.กันทรลักษ์ จ.ศรีสะเกษ 33110"
            color="subtle-dark"
            errors={errors}
            customClass="w-full"
          />

          <FormInput
            register={register}
            name="phoneNumber"
            label="เบอร์โทรศัพท์"
            type="text"
            placeholder="เช่น 0812345678"
            color="subtle-dark"
            maxLength={10}
            errors={errors}
            inputMode="numeric"
            onInput={(e) => {
              e.target.value = e.target.value
                .replace(/[^0-9]/g, "")
                .slice(0, 10);
            }}
            customClass="w-full"
          />
          <FormInput
            register={register}
            name="taxId"
            label="เลขประจำตัวผู้เสียภาษีอากร"
            type="text"
            placeholder="เช่น 0105550123451"
            color="subtle-dark"
            maxLength={13}
            errors={errors}
            inputMode="numeric"
            onInput={(e) => {
              e.target.value = e.target.value
                .replace(/[^0-9]/g, "")
                .slice(0, 13);
            }}
            customClass="w-full"
          />
        </div>
      </div>
    </div>
  </div>
);

export default CustomerInfoSection;
