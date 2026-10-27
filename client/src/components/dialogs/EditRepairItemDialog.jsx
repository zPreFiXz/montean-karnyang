import { useEffect } from "react";
import DialogTitleBar from "@/components/dialogs/DialogTitleBar";
import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import FormInput from "@/components/forms/FormInput";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DEFAULT_LABOR_SERVICE_NAME,
  PLACEHOLDER_SERVICE_NAMES,
  isPartLikeItem,
  isDiscountItem,
} from "@/constants/services";
import { editNamePriceSchema } from "@/utils/schemas";
import { formatCurrency } from "@/utils/formats";
import ItemImage from "@/components/ui/ItemImage";
import { SparePart } from "@/components/icons/Icons";

const EditRepairItemDialog = ({
  isOpen,
  onClose,
  onConfirm,
  currentPrice,
  originalPrice,
  productName,
  partNumber,
  description,
  productImage,
  isService = false,
  currentName = "",
  canEditName,
  isPartLine = false,
  isDiscountLine = false,
}) => {
  // ส่วนลดเก็บเป็นเลขติดลบ แต่ให้กรอกเป็นเลขบวก ดูจากธงไม่ใช่ชื่อ เพราะส่วนลดเปลี่ยนชื่อได้
  const isDiscount = isDiscountItem({ name: currentName, isDiscountLine });
  const nameLabel = isDiscount
    ? "ชื่อส่วนลด"
    : !isService || isPartLikeItem({ name: currentName, isPartLine })
      ? "ชื่ออะไหล่"
      : "ชื่อบริการ";

  // ชื่อยังเป็นชื่อในคลัง = ยังไม่เคยตั้ง เปิดมาให้ช่องว่างพร้อมพิมพ์ทับ
  const isUntouchedName = PLACEHOLDER_SERVICE_NAMES.includes(
    (currentName || "").trim(),
  );
  // ค่าแรงใช้ชื่อเดิมได้เลย ไม่ต้องล้างช่อง
  const keepsOwnName =
    (currentName || "").trim() === DEFAULT_LABOR_SERVICE_NAME;
  const initialName = isUntouchedName && !keepsOwnName ? "" : currentName || "";

  // ราคา 0 ที่ตั้งใจไว้ (ของแถม) ยังต้องขึ้น 0
  const initialPrice =
    (isUntouchedName || isDiscount) && !Number(currentPrice)
      ? ""
      : (Math.abs(Number(currentPrice ?? 0)).toString() ?? "");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(editNamePriceSchema),
    defaultValues: {
      price: initialPrice,
      name: initialName,
    },
  });

  const watchedPrice = watch("price");
  const price = watchedPrice || currentPrice?.toString() || "0";
  const isNameEditable =
    typeof canEditName === "boolean" ? canEditName : isService;
  const hasAdjustedPrice =
    originalPrice != null && Number(originalPrice) !== Number(currentPrice);

  useEffect(() => {
    if (isOpen) {
      reset({
        price: initialPrice,
        name: initialName,
      });
    }
  }, [isOpen, initialPrice, initialName, reset]);

  const onSubmit = (data) => {
    const priceValue = data?.price || getValues("price") || price;
    const newPrice = parseFloat(priceValue);

    // ปล่อยว่างไว้ = ยังไม่ตั้งชื่อ ใช้ชื่อในคลังไปก่อน ไม่ใช่บรรทัดไม่มีชื่อในบิล
    const typedName = (data?.name ?? getValues("name") ?? "").trim();
    const newName = isNameEditable ? typedName || currentName : undefined;

    onConfirm({ price: newPrice, name: newName });
    onClose();
  };

  const handleCancel = () => {
    reset({
      price: initialPrice,
      name: initialName,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex max-h-[90svh] w-full flex-col p-0"
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        {/* mt แทน pt ให้กล่องสูงเท่าปุ่ม ปุ่ม X จะได้ตรงกับหัวเรื่อง */}
        <DialogTitleBar
          title={isNameEditable ? "แก้ไขชื่อและราคา" : "แก้ไขราคา"}
          description={
            isNameEditable
              ? `แก้ไขชื่อและราคา ${currentName || productName}`
              : `แก้ไขราคา ${currentName || productName}`
          }
          onClose={handleCancel}
        />

        <div className="font-athiti flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 px-5">
            <div className="mb-4">
              <h2 className="font-athiti text-normal text-center text-[22px] leading-tight font-semibold md:text-2xl">
                {isService ? currentName || productName : productName}
              </h2>
            </div>

            {!isService && productImage && (
              <div className="mb-4 flex justify-center">
                <div className="border-input flex aspect-square w-full max-w-70 items-center justify-center overflow-hidden rounded-[20px] border-2">
                  <ItemImage
                    src={productImage}
                    alt={productName}
                    className="h-full w-full object-contain"
                    fallback={
                      <SparePart className="text-subtle-light h-20 w-20" />
                    }
                  />
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <div className="space-y-4 rounded-lg bg-gray-50 p-4">
                  {!isService && partNumber && (
                    <div className="flex items-center justify-between">
                      <p className="text-subtle-dark text-lg font-medium md:text-xl">
                        รหัสอะไหล่:
                      </p>
                      <p className="text-normal text-lg font-semibold md:text-xl">
                        {partNumber}
                      </p>
                    </div>
                  )}

                  {isNameEditable && (
                    <FormInput
                      register={register}
                      name="name"
                      label={nameLabel}
                      type="text"
                      placeholder={currentName || `กรอก${nameLabel}`}
                      autoComplete="off"
                      textSize="text-lg md:text-xl"
                      color="subtle-dark"
                      customClass="px-0 pt-0"
                      autoFocus={false}
                      errors={errors}
                    />
                  )}

                  {description && (
                    <div className="flex gap-3">
                      <p className="text-subtle-dark shrink-0 text-lg font-medium md:text-xl">
                        รายละเอียด:
                      </p>
                      {/* ไม่ใส่กฎตัดคำ เพราะภาษาไทยเขียนติดกัน เบราว์เซอร์จะตัดตรงไหนก็ได้ */}
                      <p className="text-normal min-w-0 flex-1 text-right text-lg font-semibold whitespace-pre-line md:text-xl">
                        {description}
                      </p>
                    </div>
                  )}

                  {hasAdjustedPrice && (
                    <div className="flex items-center justify-between">
                      <p className="text-subtle-dark text-lg font-medium md:text-xl">
                        ราคาปกติ:
                      </p>
                      <p className="text-subtle-dark text-lg font-semibold md:text-xl">
                        {formatCurrency(Number(originalPrice))}
                      </p>
                    </div>
                  )}

                  <FormInput
                    register={register}
                    name="price"
                    label={isDiscount ? "ส่วนลด (บาท)" : "ราคาต่อหน่วย (บาท)"}
                    // ช่องตัวเลขคืนค่าว่างระหว่างพิมพ์ไม่จบ ("15.") เลขที่พิมพ์จะหาย
                    type="text"
                    placeholder="0"
                    textSize="text-lg md:text-xl"
                    color="subtle-dark"
                    customClass="px-0 pt-0"
                    inputMode="numeric"
                    autoFocus={false}
                    errors={errors}
                    // ราคาเก็บเป็นจำนวนเต็ม รับจุดทศนิยมมาก็บันทึกไม่ได้ จึงกันตั้งแต่ช่องกรอก
                    onInput={(e) => {
                      e.target.value = e.target.value.replace(/[^0-9]/g, "");
                    }}
                  />
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="flex-shrink-0 px-5 pb-4">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="font-athiti bg-surface text-subtle-dark border-subtle-light flex h-[41px] flex-1 cursor-pointer items-center justify-center rounded-[20px] border text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-70 md:text-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              className="font-athiti text-surface bg-gradient-primary flex h-[41px] flex-1 cursor-pointer items-center justify-center rounded-[20px] text-lg font-semibold md:text-xl"
            >
              ยืนยัน
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditRepairItemDialog;
