import { useState, useEffect } from "react";
import { Edit, Plus, X, AlertTriangle, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import FormInput from "@/components/forms/FormInput";
import FormButton from "@/components/forms/FormButton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { addStock } from "@/api/part";
import { useNavigate } from "react-router";
import { addStockSchema } from "@/utils/schemas";

const ItemDetailDialog = ({ item, open, onOpenChange, onStockUpdate }) => {
  const [showAddStock, setShowAddStock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentItem, setCurrentItem] = useState(item);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addStockSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      setShowAddStock(false);
      reset();
    }
  }, [open, reset]);

  useEffect(() => {
    setCurrentItem(item);
  }, [item]);

  const handleShowAddStock = () => {
    setShowAddStock(true);
    // เลื่อนลงล่างสุดหลังจาก render
    setTimeout(() => {
      const scrollContainer = document.querySelector(".overflow-y-auto");
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  if (!currentItem) return null;

  const isService = currentItem.type === "service";
  const isTire = currentItem.category?.name === "ยาง";

  const renderProductInfo = () => {
    if (
      isTire &&
      currentItem.typeSpecificData &&
      currentItem.typeSpecificData.aspectRatio
    ) {
      return (
        <h2 className="font-athiti font-semibold text-center text-[22px] md:text-[24px] text-normal leading-tight">
          {currentItem.brand} {currentItem.typeSpecificData.width}/
          {currentItem.typeSpecificData.aspectRatio}R
          {currentItem.typeSpecificData.rimDiameter} {currentItem.name}
        </h2>
      );
    } else if (isTire && currentItem.typeSpecificData) {
      return (
        <h2 className="font-athiti font-semibold text-center text-[22px] md:text-[24px] text-normal leading-tight">
          {currentItem.brand} {currentItem.typeSpecificData.width}R
          {currentItem.typeSpecificData.rimDiameter} {currentItem.name}
        </h2>
      );
    }

    return (
      <h2 className="font-athiti font-semibold text-center text-[22px] md:text-[24px] text-normal leading-tight">
        {currentItem.brand} {currentItem.name}
      </h2>
    );
  };

  const handleEdit = () => {
    onOpenChange(false);
    navigate(`/inventory/${currentItem.id}?type=${currentItem.type}`);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await addStock(currentItem.id, Number(data.quantity));

      toast.success("เพิ่มสต็อกเรียบร้อยแล้ว");
      setShowAddStock(false);
      reset();

      // อัพเดทข้อมูลใน currentItem
      const updatedItem = {
        ...currentItem,
        stockQuantity: currentItem.stockQuantity + Number(data.quantity),
      };
      setCurrentItem(updatedItem);

      // เลื่อนขึ้นไปด้านบนสุด
      setTimeout(() => {
        const dialog = document.querySelector('[role="dialog"]');
        const scrollContainer = dialog?.querySelector(".overflow-y-auto");

        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }
      }, 100);

      // อัพเดทข้อมูลในหน้าหลัก
      if (onStockUpdate) {
        onStockUpdate();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={`flex flex-col w-full ${
            !isService ? "max-h-[650px]" : "max-h-[337px]"
          } p-0`}
          style={{ height: !isService ? "650px" : "350px" }}
          showCloseButton={false}
          onOpenAutoFocus={(e) => {
            // ป้องกันการโฟกัสอัตโนมัติที่ input เมื่อเปิด dialog เพื่อลดการเด้งแป้นพิมพ์ในมือถือ
            e.preventDefault();
          }}
        >
          <div className="relative flex-shrink-0 pt-[16px]">
            <DialogTitle className="font-athiti font-semibold text-center text-[22px] md:text-[24px] text-subtle-dark">
              รายละเอียด{isService ? "บริการ" : "อะไหล่"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              แสดงข้อมูลรายละเอียด{isService ? "บริการ" : "อะไหล่"}{" "}
              {currentItem.brand} {currentItem.name}
            </DialogDescription>

            {/* ปุ่มปิด dialog */}
            <button
              onClick={() => onOpenChange(false)}
              autoFocus={false}
              tabIndex={-1}
              className="absolute top-[16px] right-[20px] flex items-center justify-center w-[32px] h-[32px] rounded-full bg-black/5"
            >
              <X size={18} className="text-subtle-dark" />
            </button>
          </div>

          {/* เนื้อหา */}
          <div className="overflow-y-auto flex-1 flex flex-col font-athiti">
            <div className="flex-1 px-[20px]">
              <div className="mb-[16px]">
                {renderProductInfo()}
                {!isService && currentItem.partNumber && (
                  <div className="flex justify-center mt-[16px]">
                    {/* สถานะสต็อก */}
                    {currentItem.stockQuantity <= currentItem.minStockLevel ? (
                      <div className="flex items-center w-fit h-[41px] gap-2 px-7 pr-8 rounded-[20px] font-semibold text-[16px] md:text-[18px] text-surface bg-delete">
                        <AlertTriangle className="w-4 h-4" />
                        สต็อกต่ำ - เหลือ {currentItem.stockQuantity}{" "}
                        {currentItem.unit}
                      </div>
                    ) : (
                      <div className="flex items-center w-fit h-[41px] gap-2 px-7 pr-8 rounded-[20px] font-semibold text-[16px] md:text-[18px] text-surface bg-completed">
                        <Check className="w-4 h-4" />
                        สต็อกปกติ - เหลือ {currentItem.stockQuantity}{" "}
                        {currentItem.unit}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* รูปภาพ (ถ้ามี) */}
              {currentItem.secureUrl && (
                <div className="flex justify-center mb-[16px]">
                  <div className="overflow-hidden flex items-center justify-center w-[250px] h-[250px] rounded-[20px] border-2 border-subtle-light">
                    <img
                      src={currentItem.secureUrl}
                      alt={currentItem.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* ข้อมูลทั่วไป */}
              <div className="space-y-[8px] mt-[16px]">
                {!isService && (
                  <p className="font-athiti font-semibold text-[22px] md:text-[24px] text-normal">
                    ข้อมูลทั่วไป
                  </p>
                )}
                <div className="space-y-[8px] p-[16px] rounded-[10px] bg-gray-50">
                  {!isService && currentItem.partNumber && (
                    <div className="flex justify-between">
                      <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark">
                        รหัสอะไหล่:
                      </p>
                      <p className="font-semibold text-[18px] md:text-[20px] text-normal">
                        {currentItem.partNumber}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark">
                      หมวดหมู่:
                    </p>
                    <p className="font-semibold text-[18px] md:text-[20px] text-normal">
                      {currentItem.category?.name}
                    </p>
                  </div>
                  {currentItem.category?.name === "ช่วงล่าง" &&
                    currentItem.typeSpecificData?.suspensionType && (
                      <div className="flex justify-between">
                        <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark">
                          ประเภทช่วงล่าง:
                        </p>
                        <p className="font-semibold text-[18px] md:text-[20px] text-normal">
                          {currentItem.typeSpecificData.suspensionType ===
                          "left-right"
                            ? "ซ้าย-ขวา"
                            : "อื่นๆ"}
                        </p>
                      </div>
                    )}
                </div>

                {/* ข้อมูลราคา */}
                {!isService && (
                  <p className="mt-[16px] font-athiti font-semibold text-[22px] md:text-[24px] text-normal">
                    ข้อมูลราคา
                  </p>
                )}
                <div className="space-y-[8px] p-[16px] rounded-[10px] bg-gray-50">
                  {!isService && currentItem.costPrice && (
                    <div className="flex justify-between">
                      <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark">
                        ราคาต้นทุน:
                      </p>
                      <p className="font-semibold text-[18px] md:text-[20px] text-normal">
                        {Number(currentItem.costPrice).toLocaleString()} บาท
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark">
                      {isService ? "ราคา:" : "ราคาขาย:"}
                    </p>
                    <p className="font-semibold text-[18px] md:text-[20px] text-primary">
                      {Number(
                        currentItem.sellingPrice || currentItem.price || 0
                      ).toLocaleString()}{" "}
                      บาท
                    </p>
                  </div>
                </div>

                {/* ข้อมูลสต็อก */}
                {!isService && (
                  <div>
                    <p className="mt-[16px] font-athiti font-semibold text-[22px] md:text-[24px] text-normal">
                      ข้อมูลสต็อก
                    </p>
                    <div className="space-y-[8px] p-[16px] rounded-[10px] bg-gray-50">
                      <div className="flex justify-between">
                        <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark">
                          จำนวนสต็อก:
                        </p>
                        <p
                          className={`font-semibold text-[18px] md:text-[20px] ${
                            currentItem.stockQuantity <=
                            currentItem.minStockLevel
                              ? "text-delete"
                              : "text-completed"
                          }`}
                        >
                          {currentItem.stockQuantity} {currentItem.unit}
                        </p>
                      </div>

                      <div className="flex justify-between">
                        <p className="font-medium text-[18px] md:text-[20px] text-subtle-dark">
                          สต็อกขั้นต่ำ:
                        </p>
                        <p className="font-semibold text-[18px] md:text-[20px] text-normal">
                          {currentItem.minStockLevel} {currentItem.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* รถที่รองรับ */}
              {!isService &&
                currentItem.compatibleVehicles &&
                currentItem.compatibleVehicles.length > 0 && (
                  <div className="mt-[16px]">
                    <p className="mb-[8px] font-athiti font-semibold text-[22px] md:text-[24px] text-normal">
                      รถที่รองรับ
                    </p>
                    <div className="flex flex-wrap gap-[6px]">
                      {currentItem.compatibleVehicles.map((vehicle, index) => (
                        <p
                          key={index}
                          className="px-[10px] py-[4px] rounded-[10px] font-medium text-[18px] text-subtle-dark bg-gray-100"
                        >
                          {vehicle.brand} {vehicle.model}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

              {/* ฟอร์มเพิ่มสต็อก */}
              {!isService && showAddStock && (
                <div>
                  <p className="mt-[16px] mb-[8px] font-athiti font-semibold text-[22px] md:text-[24px] text-normal">
                    เพิ่มสต็อก
                  </p>
                  <div className="px-[16px] pb-[16px] rounded-[10px] bg-gray-50">
                    <form
                      onSubmit={handleSubmit(onSubmit)}
                      className="space-y-[16px]"
                    >
                      <FormInput
                        register={register}
                        name="quantity"
                        label={`จำนวน (${currentItem.unit})`}
                        type="number"
                        placeholder="เช่น 2"
                        textSize="text-[18px] md:text-[20px]"
                        color="subtle-dark"
                        errors={errors}
                        inputMode="numeric"
                        onWheel={(e) => e.target.blur()}
                        onInput={(e) => {
                          e.target.value = e.target.value.replace(
                            /[^0-9]/g,
                            ""
                          );
                        }}
                        customClass="px-0 pt-[16px]"
                      />

                      <FormButton
                        label={
                          isSubmitting ? (
                            "เพิ่มสต็อก"
                          ) : (
                            <div className="flex items-center justify-center gap-[8px]">
                              <Plus className="w-4 h-4" />
                              เพิ่มสต็อก
                            </div>
                          )
                        }
                        isLoading={isSubmitting}
                        className="ml-0 bg-gradient-primary"
                      />
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ส่วนท้าย */}
          <div className="flex-shrink-0 px-[16px] pb-[16px]">
            <div className="flex gap-[16px]">
              {!isService && !showAddStock && (
                <button
                  onClick={handleShowAddStock}
                  className="flex-1 flex items-center justify-center h-[41px] gap-[8px] rounded-[20px] font-athiti text-[18px] md:text-[20px] font-semibold text-surface bg-gradient-primary"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มสต็อก
                </button>
              )}

              <button
                onClick={handleEdit}
                autoFocus={false}
                className={`${
                  showAddStock && !isService ? "flex-1" : "flex-1"
                } flex items-center justify-center h-[41px] gap-[8px] rounded-[20px] font-athiti text-[18px] md:text-[20px] font-semibold text-surface bg-in-progress`}
              >
                <Edit className="w-4 h-4" />
                แก้ไข
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemDetailDialog;
