import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Trash } from "lucide-react";
import DialogTitleBar from "@/components/dialogs/DialogTitleBar";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import FormInput from "@/components/forms/FormInput";
import ComboBox from "@/components/ui/ComboBox";
import { PAYMENT_METHODS } from "@/constants/paymentMethods";
import { depositSchemaFor } from "@/utils/schemas";
import { formatCurrency } from "@/utils/formats";
import { getRepairTitle } from "@/utils/repairDisplay";
import { toastError } from "@/utils/handleError";
import { withMinDuration } from "@/utils/withMinDuration";

const DepositDialog = ({ isOpen, onClose, repair, onSave }) => {
  const isEditing = !!repair?.depositAmount;
  const total = Number(repair?.totalPrice || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(depositSchemaFor(total)),
    defaultValues: { amount: "", method: "" },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      amount: isEditing ? String(repair.depositAmount) : "",
      method: repair?.depositMethod || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const onSubmit = async ({ amount, method }) => {
    setIsSaving(true);
    try {
      await withMinDuration(() => onSave({ amount, method }));
      onClose();
    } catch (error) {
      toastError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const methodValue = watch("method");

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="flex max-h-[90svh] w-full flex-col p-0"
          showCloseButton={false}
        >
          <DialogTitleBar
            title={isEditing ? "แก้ไขมัดจำ" : "รับมัดจำ"}
            description={`${isEditing ? "แก้ไขมัดจำ" : "รับมัดจำ"} ${getRepairTitle(repair)}`}
            onClose={onClose}
          />

          <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-5">
            <h2 className="text-normal mb-4 text-center text-[22px] leading-tight font-semibold md:text-2xl">
              {getRepairTitle(repair)}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4 rounded-lg bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-subtle-dark text-lg font-medium md:text-xl">
                    ยอดรวมทั้งบิล:
                  </p>
                  <p className="text-normal text-lg font-semibold md:text-xl">
                    {formatCurrency(total)}
                  </p>
                </div>

                <FormInput
                  register={register}
                  name="amount"
                  label="มัดจำ (บาท)"
                  type="text"
                  placeholder="เช่น 1500"
                  textSize="text-lg md:text-xl"
                  color="subtle-dark"
                  customClass="px-0 pt-0"
                  inputMode="numeric"
                  autoFocus={false}
                  errors={errors}
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, "");
                  }}
                />

                <div>
                  <ComboBox
                    label="วิธีชำระเงิน"
                    color="text-subtle-dark"
                    labelClass="text-lg md:text-xl"
                    options={PAYMENT_METHODS}
                    value={methodValue}
                    onChange={(value) =>
                      setValue("method", value, { shouldValidate: true })
                    }
                    placeholder="-- เลือกวิธีชำระเงิน --"
                    customClass="text-lg md:text-xl"
                    errors={errors}
                    name="method"
                  />
                  <input type="hidden" {...register("method")} />
                </div>
              </div>
            </form>
          </div>

          <div className="flex-shrink-0 px-5 py-4">
            <div className="flex gap-4">
              {/* ลบ = บันทึกผิด คืนเงินลูกค้าทำตอนยกเลิกบิล */}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  disabled={isSaving}
                  aria-label="ลบมัดจำ"
                  className="text-surface bg-destructive flex h-[41px] w-[41px] shrink-0 cursor-pointer items-center justify-center rounded-[20px] disabled:opacity-70"
                >
                  <Trash className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="font-athiti bg-surface text-subtle-dark border-subtle-light flex h-[41px] flex-1 cursor-pointer items-center justify-center rounded-[20px] border text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-70 md:text-xl"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                onClick={handleSubmit(onSubmit)}
                disabled={isSaving}
                className="font-athiti text-surface bg-gradient-primary flex h-[41px] flex-1 cursor-pointer items-center justify-center rounded-[20px] text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-70 md:text-xl"
              >
                {isSaving && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                ยืนยัน
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={async () => {
          await withMinDuration(() => onSave({ amount: 0 }));
          onClose();
        }}
        title="ยืนยันการลบมัดจำ"
        itemName={`มัดจำ ${formatCurrency(Number(repair?.depositAmount || 0))}`}
      />
    </>
  );
};

export default DepositDialog;
