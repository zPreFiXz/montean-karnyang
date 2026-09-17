import { useEffect, useState } from "react";
import { X, Building2, Store } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import FormButton from "@/components/forms/FormButton";
import { ORGANIZATION_TYPES } from "@/constants/organizations";
import { setCustomerOrganizationType } from "@/api/customer";
import { toastError } from "@/utils/handleError";
import { toast } from "sonner";

const ICONS = { GOVERNMENT: Building2, SHOP: Store };

// ตั้งว่าลูกค้ารายนี้เป็นหน่วยงานหรือร้านค้า
// ติดกับตัวลูกค้า ไม่ใช่บิล ตั้งครั้งเดียวแล้วบิลเครดิตใบต่อๆ ไปของรายนี้ถูกรวมให้เอง
const OrganizationTypeDialog = ({ isOpen, onClose, customer, onSaved }) => {
  const [selected, setSelected] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // เปิดมาไฮไลต์ประเภทปัจจุบันไว้ การ์ดที่สว่างอยู่คือค่าที่บันทึกไว้ตอนนี้
  // เปิดใหม่ทุกครั้งต้องอ่านจากค่าจริง ไม่ใช่ค่าที่กดเล่นไว้รอบก่อนแล้วไม่ได้บันทึก
  useEffect(() => {
    if (isOpen) setSelected(customer?.organizationType || null);
  }, [isOpen, customer?.organizationType]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setCustomerOrganizationType(customer.id, selected);
      toast.success("บันทึกประเภทลูกค้าเรียบร้อยแล้ว");
      onSaved?.(selected);
      onClose();
    } catch (error) {
      toastError(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex max-h-[85svh] w-full flex-col p-0"
        showCloseButton={false}
      >
        <div className="relative mt-[16px] flex min-h-[44px] flex-shrink-0 items-center justify-center px-[64px]">
          <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-medium md:text-2xl">
            ประเภทลูกค้า
          </DialogTitle>
          <DialogDescription className="sr-only">
            เลือกว่าลูกค้ารายนี้เป็นหน่วยงานหรือร้านค้า
          </DialogDescription>
          <button
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="absolute top-1/2 right-[20px] flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/5"
          >
            <X size={20} className="text-subtle-dark" />
          </button>
        </div>

        <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-[20px]">
          {customer?.name && (
            <h2 className="text-normal text-center text-[22px] leading-tight font-semibold break-words md:text-2xl">
              {customer.name}
            </h2>
          )}

          {/* เลือกอันที่เลือกอยู่ซ้ำ = ยกเลิก กลับไปเป็นลูกค้าทั่วไป
              จึงไม่ต้องมีตัวเลือกที่สามให้รกกล่อง */}
          <div className="mt-[16px] flex gap-[16px]">
            {ORGANIZATION_TYPES.map((option) => {
              const Icon = ICONS[option.value];
              const isActive = selected === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelected(isActive ? null : option.value)}
                  aria-pressed={isActive}
                  className={`flex flex-1 cursor-pointer flex-col items-center gap-[8px] rounded-[10px] border p-[16px] duration-300 ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <span
                    className={`flex h-[45px] w-[45px] items-center justify-center rounded-full duration-300 ${
                      isActive ? "bg-primary" : "bg-subtle-light/25"
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${
                        isActive ? "text-surface" : "text-subtle-dark"
                      }`}
                    />
                  </span>
                  <span
                    className={`text-xl font-semibold md:text-[22px] ${
                      isActive ? "text-primary" : "text-subtle-dark"
                    }`}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-shrink-0 px-[16px] py-[16px]">
          <div className="flex gap-[16px]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="font-athiti bg-surface text-subtle-dark border-subtle-light flex h-[41px] flex-1 cursor-pointer items-center justify-center rounded-[20px] border text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-70 md:text-xl"
            >
              ยกเลิก
            </button>
            <FormButton
              label="บันทึก"
              isLoading={isSaving}
              disabled={isSaving}
              onClick={handleSave}
              className="font-athiti bg-gradient-primary mr-0 ml-0 flex-1"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationTypeDialog;
