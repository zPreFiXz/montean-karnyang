import { useEffect } from "react";
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

const EditNamePriceDialog = ({
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

  const isNameEditable =
    typeof canEditName === "boolean" ? canEditName : isService;

  // รีเซ็ตฟอร์มเมื่อเปิด dialog หรือเมื่อ currentPrice, currentName เปลี่ยน
  useEffect(() => {
    if (isOpen) {
      reset({
        price: (currentPrice ?? 0).toString(),
        name: currentName || "",
      });
    }
  }, [isOpen, currentPrice, currentName, reset]);

  const onSubmit = (data) => {
    const priceValue = data?.price || getValues("price") || price;
    const newPrice = parseFloat(priceValue);

    const newName = isNameEditable
      ? (data?.name ?? getValues("name") ?? currentName)
      : undefined;

    onConfirm({ price: newPrice, name: newName });
    onClose();
  };

  const handleCancel = () => {
    reset({
      price: (currentPrice ?? 0).toString(),
      name: currentName || "",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex w-full flex-col p-0"
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <div className="relative flex-shrink-0 pt-[16px]">
          <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-semibold md:text-[24px]">
            {isService ? "แก้ไขรายการบริการ" : "แก้ไขราคาอะไหล่"}
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
            aria-label="ปิดหน้าต่าง"
            className="absolute top-[16px] right-[20px] flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-full bg-black/5"
          >
            <X size={18} className="text-subtle-dark" />
          </button>
        </div>

        {/* เนื้อหา dialog */}
        <div className="font-athiti flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 px-[20px]">
            {/* ชื่อสินค้า/บริการ */}
            <div className="mb-[16px]">
              <h2 className="font-athiti text-normal text-center text-[22px] leading-tight font-semibold md:text-[24px]">
                {isService ? currentName || productName : productName}
              </h2>
            </div>

            {/* แสดงรูปภาพถ้าไม่ใช่บริการและมีรูปภาพ */}
            {!isService && productImage && (
              <div className="mb-[16px] flex justify-center">
                <div className="border-subtle-light flex h-[250px] w-[250px] items-center justify-center overflow-hidden rounded-[20px] border-2">
                  <img
                    src={productImage}
                    alt={productName}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* ฟอร์มแก้ไขชื่อและราคา */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-[8px]">
                <div className="space-y-[16px] rounded-[10px] bg-gray-50 p-[16px]">
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
                    textSize="text-[18px] md:text-[20px]"
                    color="subtle-dark"
                    customClass="px-0 pt-[0px]"
                    inputMode="numeric"
                    autoFocus={false}
                    errors={errors}
                    onInput={(e) => {
                      e.target.value = e.target.value.replace(/[^0-9.]/g, "");
                    }}
                  />
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* ปุ่มยืนยันและยกเลิก */}
        <div className="flex-shrink-0 px-[16px] pb-[16px]">
          <div className="flex gap-[16px]">
            <button
              type="button"
              onClick={handleCancel}
              className="font-athiti text-subtle-dark flex h-[41px] flex-1 cursor-pointer items-center justify-center rounded-[20px] bg-gray-100 text-[18px] font-semibold md:text-[20px]"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              className="font-athiti text-surface bg-gradient-primary flex h-[41px] flex-1 cursor-pointer items-center justify-center rounded-[20px] text-[18px] font-semibold md:text-[20px]"
            >
              ยืนยัน
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditNamePriceDialog;
