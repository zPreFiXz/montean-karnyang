import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Trash } from "lucide-react";
import DialogTitleBar from "@/components/dialogs/DialogTitleBar";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import FormInput from "@/components/forms/FormInput";
import FormButton from "@/components/forms/FormButton";
import DateField from "@/components/forms/DateField";
import { updateShopPurchaseSchemaFor } from "@/utils/schemas";
import { formatCurrency, formatQuantity } from "@/utils/formats";
import { toastError } from "@/utils/handleError";
import { withMinDuration } from "@/utils/withMinDuration";
import { deleteShopPurchase, updateShopPurchase } from "@/api/customer";

const InfoRow = ({ label, children }) => (
  <div className="flex items-center justify-between gap-2">
    <p className="text-subtle-dark text-lg font-medium md:text-xl">{label}</p>
    <p className="text-normal text-right text-lg font-semibold md:text-xl">
      {children}
    </p>
  </div>
);

// แก้รายการที่บันทึกแล้ว (เพิ่มใหม่อยู่หน้าเพิ่มอะไหล่ที่รับมา)
// รับเข้าสต็อกไปแล้ว ชนิดกับจำนวนแก้ไม่ได้ แก้ได้แค่วันที่กับราคา ผิดให้ลบแล้วเพิ่มใหม่
const ShopPurchaseDialog = ({
  isOpen,
  onClose,
  shop,
  editingItem,
  onSaved,
}) => {
  // อะไหล่อื่นๆ ไม่ผูกกับสต็อก พิมพ์ชื่อกับหน่วยเองได้
  const isTyped = !editingItem?.partId;
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(updateShopPurchaseSchemaFor(isTyped)),
    defaultValues: { itemName: "", unit: "", takenAt: "", unitPrice: "" },
  });

  useEffect(() => {
    if (!isOpen || !editingItem) return;
    reset({
      itemName: editingItem.itemName,
      unit: editingItem.unit || "",
      takenAt: String(editingItem.takenAt).slice(0, 10),
      unitPrice: String(editingItem.unitPrice),
    });
  }, [isOpen, editingItem, reset]);

  const unit = editingItem?.unit || "";

  const onSubmit = async (data) => {
    try {
      await withMinDuration(() =>
        updateShopPurchase(shop.id, editingItem.id, {
          takenAt: data.takenAt,
          unitPrice: data.unitPrice,
          ...(isTyped ? { itemName: data.itemName, unit: data.unit } : {}),
        }),
      );
      toast.success("แก้ไขอะไหล่ที่รับมาเรียบร้อยแล้ว");
      onSaved?.();
      onClose();
    } catch (error) {
      toastError(error);
    }
  };

  const amount =
    Math.round(
      Number(editingItem?.quantity || 0) * Number(watch("unitPrice") || 0),
    ) || 0;
  const title = "แก้ไขอะไหล่ที่รับมา";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="flex max-h-[90svh] w-full flex-col p-0"
          showCloseButton={false}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogTitleBar
            title={title}
            description={`${title}จาก ${shop?.name || ""}`}
            onClose={onClose}
          />

          <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-5">
            {!isTyped && (
              <p className="text-normal mb-4 text-center text-[22px] leading-tight font-semibold md:text-2xl">
                {editingItem?.itemName}
              </p>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4 rounded-lg bg-gray-50 p-4">
                <DateField
                  label="วันที่รับ:"
                  name="takenAt"
                  value={watch("takenAt")}
                  onChange={(value) =>
                    setValue("takenAt", value, { shouldValidate: true })
                  }
                  error={errors.takenAt?.message}
                  clearable={false}
                />
                {isTyped && (
                  <FormInput
                    register={register}
                    name="itemName"
                    label="ชื่ออะไหล่"
                    placeholder="เช่น สายไมล์"
                    textSize="text-lg md:text-xl"
                    color="subtle-dark"
                    customClass="px-0 pt-0"
                    autoFocus={false}
                    errors={errors}
                  />
                )}
                <InfoRow label="จำนวน:">
                  {`${formatQuantity(editingItem?.quantity)} ${unit}`.trim()}
                </InfoRow>
                {editingItem?.dotCode && (
                  <InfoRow label="สัปดาห์/ปีผลิต:">
                    {editingItem.dotCode}
                  </InfoRow>
                )}
                <FormInput
                  register={register}
                  name="unitPrice"
                  label="ราคาต่อหน่วย (บาท)"
                  type="text"
                  placeholder="เช่น 350"
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
                <InfoRow label="รวม:">{formatCurrency(amount)}</InfoRow>
              </div>
            </form>
          </div>

          <div className="flex-shrink-0 px-5 py-4">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={isSubmitting}
                aria-label="ลบรายการ"
                className="text-surface bg-destructive flex h-[41px] w-[41px] shrink-0 cursor-pointer items-center justify-center rounded-[20px] disabled:opacity-70"
              >
                <Trash className="h-4 w-4" />
              </button>
              <FormButton
                label="บันทึก"
                isLoading={isSubmitting}
                onClick={handleSubmit(onSubmit)}
                className="bg-gradient-primary mr-0 ml-0"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={async () => {
          try {
            await withMinDuration(() =>
              deleteShopPurchase(shop.id, editingItem.id),
            );
            toast.success("ลบอะไหล่ที่รับมาเรียบร้อยแล้ว");
            onSaved?.();
            onClose();
          } catch (error) {
            toastError(error);
          }
        }}
        title="ยืนยันการลบรายการ"
        itemName={editingItem?.itemName}
        note={
          editingItem?.partId
            ? "จำนวนที่รับเข้าไปจะถูกหักออกจากสต็อกคืน"
            : undefined
        }
      />
    </>
  );
};

export default ShopPurchaseDialog;
