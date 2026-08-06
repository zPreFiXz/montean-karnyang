import { useState, useEffect } from "react";
import { Edit, Plus, X, AlertTriangle, Check, Trash } from "lucide-react";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
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
import { toastError } from "@/utils/handleError";

// สะท้อนสิ่งที่ backend ทำตอนเพิ่มสต็อก: DOT เดิมบวกทับล็อตเดิม ไม่งั้นสร้างล็อตใหม่
const mergeTireLot = (lots = [], dotCode, quantity) => {
  const list = lots || [];
  const index = list.findIndex(
    (lot) => String(lot.dotCode ?? "").trim() === dotCode,
  );
  if (index === -1) return [...list, { dotCode, quantity }];

  return list.map((lot, i) =>
    i === index
      ? { ...lot, quantity: (Number(lot.quantity) || 0) + quantity }
      : lot,
  );
};

const RepairItemDetailDialog = ({
  item,
  open,
  onOpenChange,
  onStockUpdate,
}) => {
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

  // DOT 4 หลักคือ WWYY (สัปดาห์+ปี ค.ศ. 2 หลักท้าย) เช่น 0126 = สัปดาห์ 1 ปี 2026
  const tireLotSummary = (() => {
    if (!isTire) return [];

    const rows = new Map();
    for (const lot of currentItem.tireLots || []) {
      const label = String(lot.dotCode ?? "").trim() || "ไม่ระบุ";
      const quantity = Number(lot.quantity) || 0;
      const match = /^(\d{2})(\d{2})$/.exec(label);
      // เรียงเก่าไปใหม่ด้วย YYWW ค่าที่ไม่ใช่ 4 หลักไปอยู่ล่างสุด
      const sortKey = match
        ? Number(match[2] + match[1])
        : Number.MAX_SAFE_INTEGER;

      const current = rows.get(label);
      if (current) {
        current.quantity += quantity;
      } else {
        rows.set(label, { key: label, label, quantity, sortKey });
      }
    }

    return [...rows.values()].sort((a, b) => a.sortKey - b.sortKey);
  })();

  // ป้ายสถานะสต็อก: หมด/ต่ำ/ปกติ — กรณีหมดไม่ต้องบอกจำนวน เพราะคำว่าหมดสื่ออยู่แล้วว่า 0
  // "สต็อกขั้นต่ำ" = จำนวนที่ต้องมีอยู่เสมอ จึงเตือนเมื่อ "ต่ำกว่า" ไม่ใช่ "เท่ากับ"
  // (เกณฑ์นี้ต้องตรงกับ InventoryCard และ Dashboard)
  const stockStatus = (() => {
    const quantity = Number(currentItem.stockQuantity) || 0;
    const amount = `${quantity} ${currentItem.unit || ""}`.trim();

    if (quantity === 0) {
      return {
        color: "bg-destructive",
        Icon: AlertTriangle,
        label: "สต็อกหมด",
      };
    }
    if (quantity < Number(currentItem.minStockLevel)) {
      return {
        color: "bg-status-progress",
        Icon: AlertTriangle,
        label: `สต็อกต่ำ · ${amount}`,
      };
    }
    return {
      color: "bg-status-completed",
      Icon: Check,
      label: `สต็อกปกติ · ${amount}`,
    };
  })();

  const itemDisplayName = (() => {
    if (isService) return `${currentItem.name}`;
    if (isTire && currentItem.attributes) {
      const t = currentItem.attributes;
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
      currentItem.attributes &&
      currentItem.attributes.aspectRatio
    ) {
      return (
        <h2 className="font-athiti text-normal text-center text-[22px] leading-tight font-semibold md:text-2xl">
          {currentItem.brand} {currentItem.attributes.width}/
          {currentItem.attributes.aspectRatio}R
          {currentItem.attributes.rimDiameter} {currentItem.name}
        </h2>
      );
    } else if (isTire && currentItem.attributes) {
      return (
        <h2 className="font-athiti text-normal text-center text-[22px] leading-tight font-semibold md:text-2xl">
          {currentItem.brand} {currentItem.attributes.width}R
          {currentItem.attributes.rimDiameter} {currentItem.name}
        </h2>
      );
    }

    return (
      <h2 className="font-athiti text-normal text-center text-[22px] leading-tight font-semibold md:text-2xl">
        {currentItem.brand} {currentItem.name}
      </h2>
    );
  };

  const handleEdit = () => {
    onOpenChange(false);
    navigate(`/inventory/${currentItem.id}?type=${currentItem.type}`);
  };

  const onSubmit = async (data) => {
    const dotCode = String(data.dotCode || "").trim();
    if (isTire && !/^\d{4}$/.test(dotCode)) {
      toast.error("กรุณากรอก DOT เป็นเลข 4 หลัก เช่น 0126");
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePartStock(currentItem.id, {
        quantity: Number(data.quantity),
        dotCode: isTire ? dotCode : undefined,
      });
      toast.success("เพิ่มสต็อกเรียบร้อยแล้ว");
      setIsAddStockVisible(false);
      reset();

      const updatedItem = {
        ...currentItem,
        stockQuantity: currentItem.stockQuantity + Number(data.quantity),
        tireLots: isTire
          ? mergeTireLot(currentItem.tireLots, dotCode, Number(data.quantity))
          : currentItem.tireLots,
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
      toastError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          // สูงเท่าเนื้อหา แต่ไม่เกิน 85% ของจอ (เกินแล้วให้ส่วนเนื้อหาเลื่อนเอง)
          className="flex max-h-[85svh] w-full flex-col p-0"
          showCloseButton={false}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
          <div className="relative flex-shrink-0 pt-[16px]">
            <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-semibold md:text-2xl">
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
              className="absolute top-[16px] right-[20px] flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-black/5"
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
                    <div
                      className={`text-surface ${stockStatus.color} flex h-[41px] w-fit items-center gap-2 rounded-[20px] px-[24px] text-base font-semibold md:text-lg`}
                    >
                      <stockStatus.Icon className="h-4 w-4" />
                      {stockStatus.label}
                    </div>
                  </div>
                )}
              </div>

              {currentItem.secureUrl && (
                <div className="mb-[16px] flex justify-center">
                  <div className="border-subtle-light flex aspect-square w-full max-w-[250px] items-center justify-center overflow-hidden rounded-[20px] border-2">
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
                  <p className="font-athiti text-normal text-[22px] font-semibold md:text-2xl">
                    ข้อมูลทั่วไป
                  </p>
                )}
                <div className="space-y-[8px] rounded-[10px] bg-gray-50 p-[16px]">
                  {!isService && currentItem.partNumber && (
                    <div className="flex justify-between">
                      <p className="text-subtle-dark text-lg font-medium md:text-xl">
                        รหัสอะไหล่:
                      </p>
                      <p className="text-normal text-lg font-semibold md:text-xl">
                        {currentItem.partNumber}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <p className="text-subtle-dark text-lg font-medium md:text-xl">
                      หมวดหมู่:
                    </p>
                    <p className="text-normal text-lg font-semibold md:text-xl">
                      {currentItem.category?.name}
                    </p>
                  </div>

                  {currentItem.category?.name === "ช่วงล่าง" &&
                    currentItem.attributes?.suspensionType && (
                      <div className="flex justify-between">
                        <p className="text-subtle-dark text-lg font-medium md:text-xl">
                          ประเภทช่วงล่าง:
                        </p>
                        <p className="text-normal text-lg font-semibold md:text-xl">
                          {currentItem.attributes.suspensionType ===
                          "left-right"
                            ? "ซ้าย-ขวา"
                            : "อื่นๆ"}
                        </p>
                      </div>
                    )}
                </div>

                {!isService && (
                  <p className="font-athiti text-normal mt-[16px] text-[22px] font-semibold md:text-2xl">
                    ข้อมูลราคา
                  </p>
                )}

                <div className="space-y-[8px] rounded-[10px] bg-gray-50 p-[16px]">
                  {user?.role === "ADMIN" &&
                    !isService &&
                    currentItem.costPrice && (
                      <div className="flex justify-between">
                        <p className="text-subtle-dark text-lg font-medium md:text-xl">
                          ราคาต้นทุน:
                        </p>
                        <p className="text-normal text-lg font-semibold md:text-xl">
                          {formatCurrency(Number(currentItem.costPrice))}
                        </p>
                      </div>
                    )}

                  <div className="flex justify-between">
                    <p className="text-subtle-dark text-lg font-medium md:text-xl">
                      {isService ? "ราคา:" : "ราคาขาย:"}
                    </p>
                    <p className="text-primary text-lg font-semibold md:text-xl">
                      {formatCurrency(
                        Number(
                          currentItem.sellingPrice || currentItem.price || 0,
                        ),
                      )}
                    </p>
                  </div>
                </div>

                {!isService && (
                  // ต้องมี space-y เอง เพราะ space-y ของกล่องแม่ไม่ทะลุเข้ามาในตัวห่อชั้นนี้
                  <div className="space-y-[8px]">
                    <p className="font-athiti text-normal mt-[16px] text-[22px] font-semibold md:text-2xl">
                      ข้อมูลสต็อก
                    </p>
                    <div className="space-y-[8px] rounded-[10px] bg-gray-50 p-[16px]">
                      <div className="flex justify-between">
                        <p className="text-subtle-dark text-lg font-medium md:text-xl">
                          จำนวนสต็อก:
                        </p>
                        <p
                          className={`text-lg font-semibold md:text-xl ${
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
                        <p className="text-subtle-dark text-lg font-medium md:text-xl">
                          สต็อกขั้นต่ำ:
                        </p>
                        <p className="text-normal text-lg font-semibold md:text-xl">
                          {currentItem.minStockLevel} {currentItem.unit}
                        </p>
                      </div>

                      {isTire && tireLotSummary.length > 0 && (
                        <div className="space-y-[8px] border-t border-gray-200 pt-[8px]">
                          <p className="text-subtle-dark text-lg font-medium md:text-xl">
                            ปียาง:
                          </p>
                          {tireLotSummary.map((row) => (
                            <div key={row.key} className="flex justify-between">
                              <p className="text-subtle-dark pl-[12px] text-lg font-medium md:text-xl">
                                • {row.label}
                              </p>
                              <p className="text-normal text-lg font-semibold md:text-xl">
                                {row.quantity} {currentItem.unit}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!isService &&
                currentItem.compatibleVehicles &&
                currentItem.compatibleVehicles.length > 0 && (
                  <div className="mt-[16px]">
                    <p className="font-athiti text-normal mb-[8px] text-[22px] font-semibold md:text-2xl">
                      รถที่รองรับ
                    </p>
                    <div className="flex flex-wrap gap-[6px]">
                      {currentItem.compatibleVehicles.map((vehicle, index) => (
                        <p
                          key={index}
                          className="text-subtle-dark rounded-[10px] bg-gray-100 px-[10px] py-[4px] text-lg font-medium"
                        >
                          {vehicle.brand} {vehicle.model}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

              {!isService && isAddStockVisible && (
                <div>
                  <p className="font-athiti text-normal mt-[16px] mb-[8px] text-[22px] font-semibold md:text-2xl">
                    เพิ่มสต็อก
                  </p>

                  <div className="rounded-[10px] bg-gray-50 px-[16px] pb-[16px]">
                    <form
                      onSubmit={handleSubmit(onSubmit)}
                      className="space-y-[16px]"
                    >
                      {isTire && (
                        <FormInput
                          register={register}
                          name="dotCode"
                          label="สัปดาห์/ปีผลิต (DOT)"
                          type="text"
                          placeholder="เช่น 0126"
                          textSize="text-lg md:text-xl"
                          color="subtle-dark"
                          errors={errors}
                          inputMode="numeric"
                          onWheel={(e) => e.target.blur()}
                          onInput={(e) => {
                            e.target.value = e.target.value
                              .replace(/[^0-9]/g, "")
                              .slice(0, 4);
                          }}
                          customClass="px-0 pt-[16px]"
                        />
                      )}

                      <FormInput
                        register={register}
                        name="quantity"
                        label={`จำนวน (${currentItem.unit})`}
                        type="number"
                        placeholder="เช่น 2"
                        textSize="text-lg md:text-xl"
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
                  className="font-athiti text-surface bg-gradient-primary flex h-[41px] flex-1 cursor-pointer items-center justify-center gap-[4px] rounded-[20px] text-lg font-semibold md:text-xl"
                >
                  <Plus className="h-4 w-4" />
                  เพิ่มสต็อก
                </button>
              )}
              <button
                onClick={handleEdit}
                autoFocus={false}
                className="font-athiti text-surface bg-status-progress flex h-[41px] flex-1 cursor-pointer items-center justify-center gap-[4px] rounded-[20px] text-lg font-semibold md:text-xl"
              >
                <Edit className="h-4 w-4" />
                แก้ไข
              </button>
              <button
                onClick={() => {
                  onOpenChange(false);
                  setTimeout(() => setIsDeleteConfirmOpen(true), 150);
                }}
                className="font-athiti text-surface bg-destructive flex h-[41px] w-[44px] cursor-pointer items-center justify-center rounded-[20px] text-lg font-semibold md:text-xl"
                aria-label="ลบ"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
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
            toastError(error);
          } finally {
            setIsDeleteConfirmOpen(false);
          }
        }}
      />
    </div>
  );
};

export default RepairItemDetailDialog;
