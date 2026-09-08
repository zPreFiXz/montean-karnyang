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
import { PLACEHOLDER_SERVICE_NAMES } from "@/constants/services";
import { editNamePriceSchema } from "@/utils/schemas";
import { formatCurrency } from "@/utils/formats";

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
}) => {
  // ชื่อของรายการเปล่าที่ยังไม่เคยตั้ง = ชื่อในคลัง ถือว่ายังไม่ได้ตั้งชื่อ
  // เปิดมาให้ช่องว่างไว้เลย จะได้พิมพ์ทับได้ทันทีโดยไม่ต้องลบข้อความเดิมก่อน
  const isUntouchedName = PLACEHOLDER_SERVICE_NAMES.includes(
    (currentName || "").trim(),
  );
  const initialName = isUntouchedName ? "" : currentName || "";

  // รายการเปล่าอย่างค่าแรงยังไม่ได้ตั้งราคา เปิดมาให้ช่องว่างพร้อมพิมพ์
  // ของอื่นขึ้นราคาเดิมเสมอ รวมถึงราคา 0 ที่ตั้งใจตั้งไว้ (ของแถม) จะได้รู้ว่าเคยตั้งเป็น 0 ไว้จริง
  const initialPrice =
    isUntouchedName && !Number(currentPrice)
      ? ""
      : (currentPrice?.toString() ?? "");

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
        className="flex w-full flex-col p-0"
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        {/* mt แทน pt เพื่อให้กล่องนี้สูงเท่าปุ่มพอดี ปุ่ม X ที่จัดกึ่งกลางจะได้ตรงกับหัวเรื่องจริงๆ
            (ถ้าใช้ pt ปุ่มจะเยื้องลงครึ่งหนึ่งของ padding) */}
        <div className="relative mt-[16px] flex min-h-[44px] flex-shrink-0 items-center justify-center px-[64px]">
          <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-medium md:text-2xl">
            {isNameEditable ? "แก้ไขชื่อและราคา" : "แก้ไขราคา"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isNameEditable
              ? `แก้ไขชื่อและราคา ${currentName || productName}`
              : `แก้ไขราคา ${currentName || productName}`}
          </DialogDescription>
          <button
            onClick={handleCancel}
            autoFocus={false}
            aria-label="ปิดหน้าต่าง"
            className="absolute top-1/2 right-[20px] flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/5"
          >
            <X size={20} className="text-subtle-dark" />
          </button>
        </div>

        <div className="font-athiti flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 px-[20px]">
            <div className="mb-[16px]">
              <h2 className="font-athiti text-normal text-center text-[22px] leading-tight font-semibold md:text-2xl">
                {isService ? currentName || productName : productName}
              </h2>
            </div>

            {!isService && productImage && (
              <div className="mb-[16px] flex justify-center">
                <div className="border-input flex aspect-square w-full max-w-[280px] items-center justify-center overflow-hidden rounded-[20px] border-2">
                  <img
                    src={productImage}
                    alt={productName}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            )}

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
                      autoComplete="off"
                      textSize="text-lg md:text-xl"
                      color="subtle-dark"
                      customClass="px-0 pt-[0px]"
                      autoFocus={false}
                      errors={errors}
                    />
                  )}

                  {/* รหัสอะไหล่ไว้เทียบกับของจริงในมือก่อนแก้ราคา
                      วางเป็นแถวข้อมูลในกล่องเทาแบบเดียวกับหน้าต่างรายละเอียดอะไหล่ */}
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

                  {/* บันทึกของร้าน เช่น "ต้องขันสลักใหม่" — วางแบบป้ายอยู่บนข้อความอยู่ล่าง
                      เพราะเป็นข้อความยาว ต่างจากแถวอื่นที่เป็นคู่ชื่อ-ค่าสั้นๆ */}
                  {description && (
                    <div className="flex justify-between gap-[12px]">
                      <p className="text-subtle-dark shrink-0 text-lg font-medium md:text-xl">
                        รายละเอียด:
                      </p>
                      <p className="text-normal min-w-0 text-right text-lg font-semibold break-words whitespace-pre-line md:text-xl">
                        {description}
                      </p>
                    </div>
                  )}

                  {/* ราคาตั้งต้นจากคลัง แสดงเมื่อราคาถูกปรับไปแล้ว เพื่อให้รู้ว่าลดไปเท่าไหร่
                      ถ้ายังไม่ปรับก็ไม่ต้องบอก เพราะเท่ากับเลขในช่องข้างล่างอยู่แล้ว */}
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
                    label="ราคาต่อหน่วย (บาท)"
                    // ช่องข้อความ ไม่ใช่ช่องตัวเลข เพราะช่องตัวเลขคืนค่าว่างระหว่างที่ยังพิมพ์ไม่จบ
                    // (พิมพ์ "15." แล้วค่าที่อ่านได้เป็นค่าว่าง เลขที่พิมพ์ไปหายทั้งบรรทัด)
                    type="text"
                    placeholder="0"
                    textSize="text-lg md:text-xl"
                    color="subtle-dark"
                    customClass="px-0 pt-[0px]"
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

        <div className="flex-shrink-0 px-[16px] pb-[16px]">
          <div className="flex gap-[16px]">
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
