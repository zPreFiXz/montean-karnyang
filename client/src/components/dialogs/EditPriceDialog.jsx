import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import FormInput from "@/components/forms/FormInput";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editNamePriceSchema } from "@/utils/schemas";

const EditPriceDialog = ({
  isOpen,
  onClose,
  onConfirm,
  currentPrice,
  productName,
  productImage,
  isService = false,
  currentName = "",
  canEditName,
}) => {
  const [error, setError] = useState("");

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
      price: currentPrice?.toString() || "0",
      name: currentName || "",
    },
  });

  const watchedPrice = watch("price");
  const price = watchedPrice || currentPrice?.toString() || "0";

  // ควบคุมการแก้ไขชื่อผ่าน prop ถ้ามี; ถ้าไม่ส่งมา ให้ใช้กฎทั่วไป
  const isNameEditable =
    typeof canEditName === "boolean" ? canEditName : isService;
  const hasImage = !isService && !!productImage;
  const dialogHeight = isNameEditable ? 450 : hasImage ? 620 : 355;

  // Reset form เมื่อ currentPrice เปลี่ยนหรือ dialog เปิด
  useEffect(() => {
    if (isOpen) {
      reset({
        price: (currentPrice ?? 0).toString(),
        name: currentName || "",
      });
      setError("");
    }
  }, [isOpen, currentPrice, currentName, reset]);

  const onSubmit = (data) => {
    const priceValue = data?.price || getValues("price") || price;
    const newPrice = parseFloat(priceValue);

    const newName = isNameEditable
      ? data?.name ?? getValues("name") ?? currentName
      : undefined;

    setError("");
    onConfirm({ price: newPrice, name: newName });
    onClose();
  };

  const handleCancel = () => {
    reset({
      price: (currentPrice ?? 0).toString(),
      name: currentName || "",
    });
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex flex-col w-full p-0"
        style={{ height: `${dialogHeight}px`, maxHeight: `${dialogHeight}px` }}
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          // ป้องกันการโฟกัสอัตโนมัติที่ input เมื่อเปิด dialog เพื่อลดการเด้งแป้นพิมพ์ในมือถือ
          e.preventDefault();
        }}
      >
        <div className="relative flex-shrink-0 pt-[16px]">
          <DialogTitle className="font-athiti font-semibold text-center text-[22px] md:text-[24px] text-subtle-dark">
            {isService ? "แก้ไขราคาบริการ" : "แก้ไขราคาอะไหล่"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isService
              ? `แก้ไขราคาบริการ ${currentName || productName}`
              : `แก้ไขราคาอะไหล่ ${productName}`}
          </DialogDescription>

          {/* ปุ่มปิด dialog */}
          <button
            onClick={handleCancel}
            autoFocus={false}
            tabIndex={-1}
            className="absolute top-[16px] right-[20px] flex items-center justify-center w-[32px] h-[32px] rounded-full bg-black/5"
          >
            <X size={18} className="text-subtle-dark" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 flex flex-col font-athiti">
          <div className="flex-1 px-[20px]">
            {/* ชื่อสินค้า/บริการ */}
            <div className="mb-[16px]">
              <h2 className="font-athiti font-semibold text-center text-[22px] md:text-[24px] text-normal leading-tight">
                {isService ? currentName || productName : productName}
              </h2>
            </div>

            {/* รูปภาพ (ถ้ามี) - ซ่อนสำหรับบริการ */}
            {!isService && productImage && (
              <div className="flex justify-center mb-[16px]">
                <div className="overflow-hidden flex items-center justify-center w-[250px] h-[250px] rounded-[20px] border-2 border-subtle-light">
                  <img
                    src={productImage}
                    alt={productName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Form แก้ไขราคา */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-[8px]">
                <div className="space-y-[16px] p-[16px] rounded-[10px] bg-gray-50">
                  {isNameEditable && (
                    <FormInput
                      register={register}
                      name="name"
                      label="ชื่อบริการ"
                      type="text"
                      placeholder={currentName || "กรอกชื่อบริการ"}
                      textSize="text-[18px] md:text-[20px]"
                      color="subtle-dark"
                      customClass="px-0 pt-[0px]"
                      autoFocus={false}
                      errors={errors}
                    />
                  )}

                  <FormInput
                    register={register}
                    name="price"
                    label="ราคาต่อหน่วย (บาท)"
                    type="text"
                    placeholder="0"
                    textSize="text-[18px] md:text-[20px]"
                    color="subtle-dark"
                    customClass="px-0 pt-[0px]"
                    inputMode="numeric"
                    autoFocus={false}
                    errors={errors}
                    onInput={(e) => {
                      e.target.value = e.target.value.replace(/[^0-9.]/g, "");
                      setError("");
                    }}
                  />
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-[16px] pb-[16px]">
          <div className="flex gap-[16px]">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center h-[41px] rounded-[20px] font-athiti text-[18px] md:text-[20px] font-semibold text-subtle-dark bg-gray-100 hover:bg-gray-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              className="flex-1 flex items-center justify-center h-[41px] rounded-[20px] font-athiti text-[18px] md:text-[20px] font-semibold text-surface bg-gradient-primary hover:bg-gradient-primary/90"
            >
              ยืนยัน
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPriceDialog;
