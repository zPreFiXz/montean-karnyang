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
import InventoryCard from "@/components/cards/InventoryCard";
import ComboBox from "@/components/ui/ComboBox";
import { useUnitOptions } from "@/constants/units";
import { tracksTireLots } from "@/constants/categories";
import { shopPurchaseSchemaFor } from "@/utils/schemas";
import { formatCurrency, formatQuantity } from "@/utils/formats";
import { toLocalDateKey } from "@/utils/date";
import { toastError } from "@/utils/handleError";
import { withMinDuration } from "@/utils/withMinDuration";
import {
  createShopPurchase,
  deleteShopPurchase,
  updateShopPurchase,
} from "@/api/customer";

const InfoRow = ({ label, children }) => (
  <div className="flex items-center justify-between gap-2">
    <p className="text-subtle-dark text-lg font-medium md:text-xl">{label}</p>
    <p className="text-normal text-right text-lg font-semibold md:text-xl">
      {children}
    </p>
  </div>
);

// part = อะไหล่ที่เพิ่งเลือกจากสต็อก (เพิ่มใหม่) isCustom = อะไหล่อื่นๆ พิมพ์ชื่อเอง ไม่แตะสต็อก
// editingItem = รายการเดิม (แก้ไข)
// รับเข้าสต็อกตอนเพิ่ม ชนิดกับจำนวนแก้ทีหลังไม่ได้ แก้ได้แค่วันที่กับราคา ผิดให้ลบแล้วเพิ่มใหม่
const ShopPurchaseDialog = ({
  isOpen,
  onClose,
  shop,
  part,
  isCustom = false,
  editingItem,
  onChangePart,
  onSaved,
}) => {
  const isEditing = !!editingItem;
  // อะไหล่อื่นๆ ทั้งตอนเพิ่มและตอนแก้ (รายการเดิมที่ไม่ผูกกับสต็อก) พิมพ์ชื่อกับหน่วยเองได้
  const isTyped = isEditing ? !editingItem.partId : isCustom;
  const needsDot =
    !isEditing && !isTyped && tracksTireLots(part?.category?.name);
  const { partUnitOptions } = useUnitOptions();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(shopPurchaseSchemaFor(needsDot, isTyped)),
    defaultValues: {
      itemName: "",
      unit: "",
      takenAt: "",
      quantity: "",
      dotCode: "",
      unitPrice: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset(
      isEditing
        ? {
            itemName: editingItem.itemName,
            unit: editingItem.unit || "",
            takenAt: String(editingItem.takenAt).slice(0, 10),
            quantity: formatQuantity(editingItem.quantity),
            dotCode: editingItem.dotCode || "",
            unitPrice: String(editingItem.unitPrice),
          }
        : {
            itemName: "",
            unit: "",
            takenAt: toLocalDateKey(),
            quantity: "",
            dotCode: "",
            // ราคาที่ร้านเราซื้อมา ใกล้เคียงที่สุดคือราคาทุน แก้ได้ถ้าร้านนี้ขายต่างไป
            unitPrice:
              !isCustom && part?.costPrice != null
                ? String(part.costPrice)
                : "",
          },
    );
  }, [isOpen, isEditing, isCustom, editingItem, part, reset]);

  const unit =
    (isTyped ? watch("unit") : isEditing ? editingItem.unit : part?.unit) || "";

  const onSubmit = async (data) => {
    try {
      await withMinDuration(() =>
        isEditing
          ? updateShopPurchase(shop.id, editingItem.id, {
              takenAt: data.takenAt,
              unitPrice: data.unitPrice,
              ...(isTyped ? { itemName: data.itemName, unit: data.unit } : {}),
            })
          : createShopPurchase(shop.id, {
              ...(isTyped
                ? { itemName: data.itemName, unit: data.unit }
                : { partId: part.id }),
              takenAt: data.takenAt,
              quantity: data.quantity,
              dotCode: needsDot ? data.dotCode : undefined,
              unitPrice: data.unitPrice,
            }),
      );
      toast.success(
        isEditing
          ? "แก้ไขอะไหล่ที่รับมาเรียบร้อยแล้ว"
          : "เพิ่มอะไหล่ที่รับมาเรียบร้อยแล้ว",
      );
      onSaved?.();
      onClose();
    } catch (error) {
      toastError(error);
    }
  };

  const amount =
    Math.round(
      Number(watch("quantity") || 0) * Number(watch("unitPrice") || 0),
    ) || 0;
  const title = isEditing ? "แก้ไขอะไหล่ที่รับมา" : "เพิ่มอะไหล่ที่รับมา";
  const numericInput = (allowDecimal) => (e) => {
    e.target.value = e.target.value.replace(
      allowDecimal ? /[^0-9.]/g : /[^0-9]/g,
      "",
    );
  };

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
            {isTyped ? (
              !isEditing && (
                <div className="mb-4 rounded-lg border border-dashed border-gray-300 p-3 text-center">
                  <p className="text-normal text-lg font-semibold md:text-xl">
                    อะไหล่อื่นๆ
                  </p>
                  <p className="text-subtle-dark text-base font-medium md:text-lg">
                    พิมพ์ชื่อเอง ไม่นับเข้าสต็อก
                  </p>
                  <button
                    type="button"
                    onClick={onChangePart}
                    className="text-primary mt-1 cursor-pointer text-lg font-semibold md:text-xl"
                  >
                    เปลี่ยนอะไหล่
                  </button>
                </div>
              )
            ) : isEditing ? (
              <p className="text-normal mb-4 text-center text-[22px] leading-tight font-semibold md:text-2xl">
                {editingItem.itemName}
              </p>
            ) : (
              part && (
                <div className="mb-4">
                  <InventoryCard
                    item={part}
                    brand={part.brand}
                    name={part.name}
                    unit={part.unit}
                    sellingPrice={part.sellingPrice}
                    quantity={part.stockQuantity}
                    minStockLevel={part.minStockLevel}
                    attributes={part.attributes}
                    secureUrl={part.secureUrl}
                    category={part.category?.name}
                  />
                  <button
                    type="button"
                    onClick={onChangePart}
                    className="text-primary mt-2 w-full cursor-pointer text-center text-lg font-semibold md:text-xl"
                  >
                    เปลี่ยนอะไหล่
                  </button>
                </div>
              )
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
                {isEditing ? (
                  <>
                    <InfoRow label="จำนวน:">
                      {`${formatQuantity(editingItem.quantity)} ${unit}`.trim()}
                    </InfoRow>
                    {editingItem.dotCode && (
                      <InfoRow label="สัปดาห์/ปีผลิต:">
                        {editingItem.dotCode}
                      </InfoRow>
                    )}
                  </>
                ) : (
                  <div
                    className={
                      needsDot || isTyped ? "grid grid-cols-2 gap-2" : undefined
                    }
                  >
                    <FormInput
                      register={register}
                      name="quantity"
                      label={unit && !isTyped ? `จำนวน (${unit})` : "จำนวน"}
                      type="text"
                      placeholder="เช่น 2"
                      textSize="text-lg md:text-xl"
                      color="subtle-dark"
                      customClass="px-0 pt-0"
                      inputMode={needsDot ? "numeric" : "decimal"}
                      autoFocus={false}
                      errors={errors}
                      onInput={numericInput(!needsDot)}
                    />
                    {needsDot && (
                      <FormInput
                        register={register}
                        name="dotCode"
                        label="สัปดาห์/ปีผลิต"
                        type="text"
                        placeholder="เช่น 0126"
                        textSize="text-lg md:text-xl"
                        color="subtle-dark"
                        customClass="px-0 pt-0"
                        inputMode="numeric"
                        maxLength={4}
                        autoFocus={false}
                        errors={errors}
                        onInput={numericInput(false)}
                      />
                    )}
                    {isTyped && (
                      <ComboBox
                        label="หน่วย"
                        color="text-subtle-dark"
                        labelClass="text-lg md:text-xl"
                        options={partUnitOptions}
                        value={watch("unit")}
                        onChange={(value) => setValue("unit", value)}
                        placeholder="-- เลือกหน่วย --"
                        customClass="text-lg md:text-xl"
                        creatable
                        createLabel={(text) => `เพิ่มหน่วย "${text}"`}
                        name="unit"
                      />
                    )}
                  </div>
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
                  onInput={numericInput(false)}
                />
                <InfoRow label="รวม:">{formatCurrency(amount)}</InfoRow>
              </div>
              {!isEditing && !isTyped && (
                <p className="text-subtle-dark mt-2 text-base font-medium md:text-lg">
                  บันทึกแล้วจำนวนนี้จะถูกบวกเข้าสต็อกให้อัตโนมัติ
                </p>
              )}
            </form>
          </div>

          <div className="flex-shrink-0 px-5 py-4">
            <div className="flex gap-4">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  disabled={isSubmitting}
                  aria-label="ลบรายการ"
                  className="text-surface bg-destructive flex h-[41px] w-[41px] shrink-0 cursor-pointer items-center justify-center rounded-[20px] disabled:opacity-70"
                >
                  <Trash className="h-4 w-4" />
                </button>
              )}
              <FormButton
                label={
                  isEditing
                    ? "บันทึก"
                    : isTyped
                      ? "เพิ่มรายการ"
                      : "รับเข้าสต็อก"
                }
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
