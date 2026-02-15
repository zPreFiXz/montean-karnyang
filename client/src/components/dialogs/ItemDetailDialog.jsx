import { useState, useEffect } from "react";
import { Edit, Plus, X, AlertTriangle, Check, Trash } from "lucide-react";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
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
import { updatePartStock, deletePart } from "@/api/part";
import { deleteService } from "@/api/service";
import { useNavigate } from "react-router";
import { updatePartStockSchema } from "@/utils/schemas";
import useAuthStore from "@/stores/useAuthStore";
import { formatCurrency } from "@/utils/formats";

const ItemDetailDialog = ({ item, open, onOpenChange, onStockUpdate }) => {
  const [isAddStockVisible, setIsAddStockVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(item);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updatePartStockSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      setIsAddStockVisible(false);
      reset();
    }
  }, [open, reset]);

  useEffect(() => {
    setCurrentItem(item);
  }, [item]);

  const handleShowAddStock = () => {
    setIsAddStockVisible(true);
    setTimeout(() => {
      const scrollContainer = document.querySelector(".overflow-y-auto");
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 200);
  };

  if (!currentItem) return null;

  const isService = currentItem.type === "service";
  const isTire = currentItem.category?.name === "ยาง";

  const itemDisplayName = (() => {
    if (isService) return `${currentItem.name}`;
    if (isTire && currentItem.typeSpecificData) {
      const t = currentItem.typeSpecificData;
      if (t.aspectRatio) {
        return `${currentItem.brand} ${t.width}/${t.aspectRatio}R${t.rimDiameter} ${currentItem.name}`;
      }
      return `${currentItem.brand} ${t.width}R${t.rimDiameter} ${currentItem.name}`;
    }
    return `${currentItem.brand} ${currentItem.name}`;
  })();

  const renderProductInfo = () => {
    if (
      isTire &&
      currentItem.typeSpecificData &&
      currentItem.typeSpecificData.aspectRatio
    ) {
      return (
        <h2 className="font-athiti text-normal text-center text-[22px] leading-tight font-semibold md:text-[24px]">
          {currentItem.brand} {currentItem.typeSpecificData.width}/
          {currentItem.typeSpecificData.aspectRatio}R
          {currentItem.typeSpecificData.rimDiameter} {currentItem.name}
        </h2>
      );
    } else if (isTire && currentItem.typeSpecificData) {
      return (
        <h2 className="font-athiti text-normal text-center text-[22px] leading-tight font-semibold md:text-[24px]">
          {currentItem.brand} {currentItem.typeSpecificData.width}R
          {currentItem.typeSpecificData.rimDiameter} {currentItem.name}
        </h2>
      );
    }

    return (
      <h2 className="font-athiti text-normal text-center text-[22px] leading-tight font-semibold md:text-[24px]">
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

      await updatePartStock(currentItem.id, Number(data.quantity));

      toast.success("เพิ่มสต็อกเรียบร้อยแล้ว");
      setIsAddStockVisible(false);
      reset();

      const updatedItem = {
        ...currentItem,
        stockQuantity: currentItem.stockQuantity + Number(data.quantity),
      };
      setCurrentItem(updatedItem);

      setTimeout(() => {
        const dialog = document.querySelector('[role="dialog"]');
        const scrollContainer = dialog?.querySelector(".overflow-y-auto");

        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }
      }, 200);

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
          className={`flex w-full flex-col ${!isService ? "max-h-[650px]" : "max-h-[337px]"} p-0`}
          style={{ height: !isService ? "650px" : "350px" }}
          showCloseButton={false}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
          <div className="relative flex-shrink-0 pt-[16px]">
            <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-semibold md:text-[24px]">
              รายละเอียด{isService ? "บริการ" : "อะไหล่"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              แสดงข้อมูลรายละเอียด{isService ? "บริการ" : "อะไหล่"}{" "}
              {currentItem.brand} {currentItem.name}
            </DialogDescription>
            <button
              onClick={() => onOpenChange(false)}
              autoFocus={false}
              tabIndex={-1}
              aria-label="ปิดหน้าต่าง"
              className="absolute top-[16px] right-[20px] flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-full bg-black/5"
            >
              <X size={18} className="text-subtle-dark" />
            </button>
          </div>
          <div className="font-athiti flex flex-1 flex-col overflow-y-auto">
            <div className="flex-1 px-[20px]">
              <div className="mb-[16px]">
                {renderProductInfo()}
                {!isService && currentItem.partNumber && (
                  <div className="mt-[16px] flex justify-center">
                    {currentItem.stockQuantity === 0 ? (
                      <div className="text-surface bg-destructive flex h-[41px] w-fit items-center gap-2 rounded-[20px] px-7 pr-8 text-[16px] font-semibold md:text-[18px]">
                        <AlertTriangle className="h-4 w-4" />
                        สต็อกหมด - จำนวน {currentItem.stockQuantity}{" "}
                        {currentItem.unit}
                      </div>
                    ) : currentItem.stockQuantity <=
                      currentItem.minStockLevel ? (
                      <div className="text-surface bg-status-progress flex h-[41px] w-fit items-center gap-2 rounded-[20px] px-7 pr-8 text-[16px] font-semibold md:text-[18px]">
                        <AlertTriangle className="h-4 w-4" />
                        สต็อกต่ำ - จำนวน {currentItem.stockQuantity}{" "}
                        {currentItem.unit}
                      </div>
                    ) : (
                      <div className="text-surface bg-status-completed flex h-[41px] w-fit items-center gap-2 rounded-[20px] px-7 pr-8 text-[16px] font-semibold md:text-[18px]">
                        <Check className="h-4 w-4" />
                        สต็อกปกติ - จำนวน {currentItem.stockQuantity}{" "}
                        {currentItem.unit}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {currentItem.secureUrl && (
                <div className="mb-[16px] flex justify-center">
                  <div className="border-subtle-light flex h-[250px] w-[250px] items-center justify-center overflow-hidden rounded-[20px] border-2">
                    <img
                      src={currentItem.secureUrl}
                      alt={currentItem.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              )}
              <div className="mt-[16px] space-y-[8px]">
                {!isService && (
                  <p className="font-athiti text-normal text-[22px] font-semibold md:text-[24px]">
                    ข้อมูลทั่วไป
                  </p>
                )}
                <div className="space-y-[8px] rounded-[10px] bg-gray-50 p-[16px]">
                  {!isService && currentItem.partNumber && (
                    <div className="flex justify-between">
                      <p className="text-subtle-dark text-[18px] font-medium md:text-[20px]">
                        รหัสอะไหล่:
                      </p>
                      <p className="text-normal text-[18px] font-semibold md:text-[20px]">
                        {currentItem.partNumber}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <p className="text-subtle-dark text-[18px] font-medium md:text-[20px]">
                      หมวดหมู่:
                    </p>
                    <p className="text-normal text-[18px] font-semibold md:text-[20px]">
                      {currentItem.category?.name}
                    </p>
                  </div>
                  {currentItem.category?.name === "ช่วงล่าง" &&
                    currentItem.typeSpecificData?.suspensionType && (
                      <div className="flex justify-between">
                        <p className="text-subtle-dark text-[18px] font-medium md:text-[20px]">
                          ประเภทช่วงล่าง:
                        </p>
                        <p className="text-normal text-[18px] font-semibold md:text-[20px]">
                          {currentItem.typeSpecificData.suspensionType ===
                          "left-right"
                            ? "ซ้าย-ขวา"
                            : "อื่นๆ"}
                        </p>
                      </div>
                    )}
                </div>
                {!isService && (
                  <p className="font-athiti text-normal mt-[16px] text-[22px] font-semibold md:text-[24px]">
                    ข้อมูลราคา
                  </p>
                )}
                <div className="space-y-[8px] rounded-[10px] bg-gray-50 p-[16px]">
                  {user?.role === "ADMIN" &&
                    !isService &&
                    currentItem.costPrice && (
                      <div className="flex justify-between">
                        <p className="text-subtle-dark text-[18px] font-medium md:text-[20px]">
                          ราคาต้นทุน:
                        </p>
                        <p className="text-normal text-[18px] font-semibold md:text-[20px]">
                          {formatCurrency(Number(currentItem.costPrice))}
                        </p>
                      </div>
                    )}
                  <div className="flex justify-between">
                    <p className="text-subtle-dark text-[18px] font-medium md:text-[20px]">
                      {isService ? "ราคา:" : "ราคาขาย:"}
                    </p>
                    <p className="text-primary text-[18px] font-semibold md:text-[20px]">
                      {formatCurrency(
                        Number(
                          currentItem.sellingPrice || currentItem.price || 0,
                        ),
                      )}
                    </p>
                  </div>
                </div>
                {!isService && (
                  <div>
                    <p className="font-athiti text-normal mt-[16px] text-[22px] font-semibold md:text-[24px]">
                      ข้อมูลสต็อก
                    </p>
                    <div className="space-y-[8px] rounded-[10px] bg-gray-50 p-[16px]">
                      <div className="flex justify-between">
                        <p className="text-subtle-dark text-[18px] font-medium md:text-[20px]">
                          จำนวนสต็อก:
                        </p>
                        <p
                          className={`text-[18px] font-semibold md:text-[20px] ${
                            currentItem.stockQuantity === 0
                              ? "text-destructive"
                              : currentItem.stockQuantity <=
                                  currentItem.minStockLevel
                                ? "text-status-progress"
                                : "text-status-completed"
                          }`}
                        >
                          {currentItem.stockQuantity} {currentItem.unit}
                        </p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-subtle-dark text-[18px] font-medium md:text-[20px]">
                          สต็อกขั้นต่ำ:
                        </p>
                        <p className="text-normal text-[18px] font-semibold md:text-[20px]">
                          {currentItem.minStockLevel} {currentItem.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {!isService &&
                currentItem.compatibleVehicles &&
                currentItem.compatibleVehicles.length > 0 && (
                  <div className="mt-[16px]">
                    <p className="font-athiti text-normal mb-[8px] text-[22px] font-semibold md:text-[24px]">
                      รถที่รองรับ
                    </p>
                    <div className="flex flex-wrap gap-[6px]">
                      {currentItem.compatibleVehicles.map((vehicle, index) => (
                        <p
                          key={index}
                          className="text-subtle-dark rounded-[10px] bg-gray-100 px-[10px] py-[4px] text-[18px] font-medium"
                        >
                          {vehicle.brand} {vehicle.model}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              {!isService && isAddStockVisible && (
                <div>
                  <p className="font-athiti text-normal mt-[16px] mb-[8px] text-[22px] font-semibold md:text-[24px]">
                    เพิ่มสต็อก
                  </p>
                  <div className="rounded-[10px] bg-gray-50 px-[16px] pb-[16px]">
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
                            "",
                          );
                        }}
                        customClass="px-0 pt-[16px]"
                      />

                      <FormButton
                        label={
                          isSubmitting ? (
                            "เพิ่มสต็อก"
                          ) : (
                            <div className="flex cursor-pointer items-center justify-center gap-[8px]">
                              <Plus className="h-4 w-4" />
                              เพิ่มสต็อก
                            </div>
                          )
                        }
                        isLoading={isSubmitting}
                        className="bg-gradient-primary ml-0"
                      />
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 px-[16px] pb-[16px]">
            <div className="flex items-center gap-[16px]">
              {!isService && !isAddStockVisible && (
                <button
                  onClick={handleShowAddStock}
                  className="font-athiti text-surface bg-gradient-primary flex h-[41px] flex-1 cursor-pointer items-center justify-center gap-[4px] rounded-[20px] text-[18px] font-semibold md:text-[20px]"
                >
                  <Plus className="h-4 w-4" />
                  เพิ่มสต็อก
                </button>
              )}
              <button
                onClick={handleEdit}
                autoFocus={false}
                className="font-athiti text-surface bg-status-progress flex h-[41px] flex-1 cursor-pointer items-center justify-center gap-[4px] rounded-[20px] text-[18px] font-semibold md:text-[20px]"
              >
                <Edit className="h-4 w-4" />
                แก้ไข
              </button>
              <button
                onClick={() => {
                  onOpenChange(false);
                  setTimeout(() => setIsDeleteConfirmOpen(true), 150);
                }}
                className="font-athiti text-surface bg-destructive flex h-[41px] w-[44px] cursor-pointer items-center justify-center rounded-[20px] text-[18px] font-semibold md:text-[20px]"
                aria-label="ลบ"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <DeleteConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        itemName={itemDisplayName}
        title="ยืนยันการลบ"
        message={
          isService
            ? "ต้องการลบบริการนี้หรือไม่?"
            : "ต้องการลบอะไหล่นี้หรือไม่?"
        }
        onConfirm={async () => {
          try {
            if (isService) {
              await deleteService(currentItem.id);
            } else {
              await deletePart(currentItem.id);
            }
            toast.success(
              isService ? "ลบบริการเรียบร้อยแล้ว" : "ลบอะไหล่เรียบร้อยแล้ว",
            );
            if (onStockUpdate) onStockUpdate();
          } catch (error) {
            console.error(error);
          } finally {
            setIsDeleteConfirmOpen(false);
          }
        }}
      />
    </div>
  );
};

export default ItemDetailDialog;
