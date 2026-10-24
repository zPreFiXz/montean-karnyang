import { ChevronDown, ContactRound } from "lucide-react";
import CustomerNameInput from "@/components/forms/CustomerNameInput";
import FormInput from "@/components/forms/FormInput";
import { formatPhone } from "@/utils/formats";

const CustomerInfoSection = ({
  register,
  errors,
  watch,
  isOpen,
  onToggle,
  setValue,
}) => {
  const handleSelectCustomer = (customer) => {
    setValue("name", customer.name || "", { shouldValidate: true });
    setValue("phoneNumber", customer.phoneNumber || "", {
      shouldValidate: true,
    });
    setValue("address", customer.address || "");
    setValue("taxId", customer.taxId || "", { shouldValidate: true });
  };

  return (
    <div className="bg-surface mx-5 mt-4 overflow-hidden rounded-lg">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="customer-info-panel"
        className="focus-visible:ring-primary/50 flex w-full cursor-pointer items-center justify-between px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-inset"
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
            <ContactRound className="text-primary h-6 w-6" />
          </div>
          {/* ความสูงคงที่ ไม่งั้นหัวข้อจะขยับตอนพิมพ์ชื่อ — ไม่มีชื่อก็ให้หัวข้ออยู่กลางแทน */}
          <div className="flex min-h-14 flex-col justify-center text-left">
            <p className="text-normal text-xl font-medium">ข้อมูลลูกค้า</p>
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

      <div
        inert={!isOpen}
        // grid-rows 0fr→1fr ขยายตามความสูงจริง max-h ตายตัวจะตัดเนื้อหาตอนขึ้น error ทุกช่อง
        id="customer-info-panel"
        className={`grid transition-all duration-200 motion-reduce:transition-none ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 px-4 pb-4">
            <CustomerNameInput
              register={register}
              errors={errors}
              value={watch("name")}
              onSelect={handleSelectCustomer}
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
};

export default CustomerInfoSection;
