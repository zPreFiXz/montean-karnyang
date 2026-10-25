import { useEffect, useState } from "react";
import DialogTitleBar from "@/components/dialogs/DialogTitleBar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import FormButton from "@/components/forms/FormButton";
import { setCustomerOrganizationType } from "@/api/customer";
import { toastError } from "@/utils/handleError";
import { withMinDuration } from "@/utils/withMinDuration";
import { toast } from "sonner";
import {
  ORGANIZATION_TYPES,
  organizationIcon,
} from "@/constants/organizations";

// ลูกค้าทั่วไปเก็บเป็นค่าว่าง แต่ต้องมีปุ่มให้เลือกตรงๆ
const OPTIONS = [...ORGANIZATION_TYPES, { value: null, label: "ลูกค้าทั่วไป" }];

// silent = เรียกเป็นขั้นตอนหนึ่งของงานอื่นที่แจ้งผลเองอยู่แล้ว
const OrganizationTypeDialog = ({
  isOpen,
  onClose,
  customer,
  onSaved,
  silent = false,
}) => {
  const [selected, setSelected] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // เปิดใหม่ต้องอ่านจากค่าจริง ไม่ใช่ค่าที่กดค้างไว้รอบก่อน
  useEffect(() => {
    if (isOpen) setSelected(customer?.organizationType || null);
  }, [isOpen, customer?.organizationType]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await withMinDuration(() =>
        setCustomerOrganizationType(customer.id, selected),
      );
      if (!silent) {
        const label = OPTIONS.find((item) => item.value === selected)?.label;
        toast.success(`เปลี่ยนเป็น${label}เรียบร้อยแล้ว`);
      }
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
        <DialogTitleBar
          title="ประเภทลูกค้า"
          description="เลือกว่าลูกค้ารายนี้เป็นหน่วยงานหรือร้านค้า"
          onClose={onClose}
        />

        <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-5">
          {customer?.name && (
            <h2 className="text-normal text-center text-[22px] leading-tight font-semibold break-words md:text-2xl">
              {customer.name}
            </h2>
          )}

          <div className="mt-4 flex gap-2">
            {OPTIONS.map((option) => {
              const Icon = organizationIcon(option.value);
              const isActive = selected === option.value;

              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setSelected(option.value)}
                  aria-pressed={isActive}
                  className={`flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-lg border px-2 py-4 duration-300 ${
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
                    className={`text-center text-lg font-semibold md:text-xl ${
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

        <div className="flex-shrink-0 px-4 py-4">
          <div className="flex gap-4">
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
