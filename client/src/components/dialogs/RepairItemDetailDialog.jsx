import { useState, useEffect, useCallback } from "react";
import { Edit, Plus, X, AlertTriangle, Check, Info, Trash } from "lucide-react";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import FormInput from "@/components/forms/FormInput";
import TireLotInput from "@/components/forms/TireLotInput";
import FormButton from "@/components/forms/FormButton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updatePartStock, deletePart } from "@/api/part";
import { deleteService } from "@/api/service";
import { useNavigate } from "react-router";
import { updateStockSchema } from "@/utils/schemas";
import useAuthStore from "@/stores/useAuthStore";
import { formatCurrency } from "@/utils/formats";
import { toastError } from "@/utils/handleError";
import { tracksStock } from "@/utils/stock";
import { dotOrderKey } from "@/utils/tireLot";

// สะท้อนสิ่งที่ backend ทำตอนเพิ่มสต็อก: DOT เดิมบวกทับล็อตเดิม ไม่งั้นสร้างล็อตใหม่
// (คำนวณฝั่งนี้ด้วยเพื่อให้ไดอะล็อกอัปเดตทันทีโดยไม่ต้องดึงข้อมูลใหม่)
const mergeTireLots = (lots = [], added = []) =>
  added.reduce((list, { dotCode, quantity }) => {
    const index = list.findIndex(
      (lot) => String(lot.dotCode ?? "").trim() === dotCode,
    );
    if (index === -1) return [...list, { dotCode, quantity }];

    return list.map((lot, i) =>
      i === index
        ? { ...lot, quantity: (Number(lot.quantity) || 0) + quantity }
        : lot,
    );
  }, lots || []);

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
  const isTire = currentItem?.category?.name === "ยาง";
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateStockSchema),
    mode: "onChange",
  });

  // reset() เปล่าๆ จะล้างแถวยางจนหมดแล้วไม่งอกกลับ เพราะ TireLotInput ไม่ได้ถูก unmount
  // (ฟอร์มแค่ยุบด้วย CSS) ตัวสร้างแถวแรกจึงทำงานไปแล้วครั้งเดียว — ต้องคืนแถวว่างให้เอง
  const resetStockForm = useCallback(() => {
    reset(isTire ? { tireLots: [{ dotCode: "", quantity: "" }] } : {});
  }, [reset, isTire]);

  useEffect(() => {
    if (!open) {
      setIsAddStockVisible(false);
      resetStockForm();
    }
  }, [open, resetStockForm]);

  useEffect(() => {
    setCurrentItem(item);
  }, [item]);

  // จำกัดขอบเขตในไดอะล็อกเสมอ ไม่งั้นอาจไปเจอพื้นที่เลื่อนอื่นในหน้าที่ใช้คลาสเดียวกัน
  const dialogScroller = () =>
    document
      .querySelector('[role="dialog"]')
      ?.querySelector(".overflow-y-auto");

  // รอ 1 เฟรมให้ฟอร์มถูกวาดก่อน ค่อยเลื่อนไปหา
  const scrollDialogTo = (top) => {
    setTimeout(() => {
      dialogScroller()?.scrollTo({ top, behavior: "smooth" });
    }, 200);
  };

  const handleShowAddStock = () => {
    setIsAddStockVisible(true);
  };

  // เลื่อนหลังฟอร์มขยายเสร็จจริง ไม่ใช่เดาเวลาให้ตรงกับ transition
  // ถ้าเลื่อนระหว่างที่ยังขยายอยู่ ปลายทางจะถูกคำนวณจากความสูงที่ยังไม่เต็ม แล้วเนื้อหางอกตามทีหลัง = กระตุก
  const handleAddStockTransitionEnd = (e) => {
    if (e.propertyName !== "grid-template-rows") return;
    if (!isAddStockVisible) return;
    dialogScroller()?.scrollTo({
      top: Number.MAX_SAFE_INTEGER,
      behavior: "smooth",
    });
  };

  const handleCancelAddStock = () => {
    setIsAddStockVisible(false);
    resetStockForm();
  };

  if (!currentItem) return null;

  const isService = currentItem.type === "service";

  // DOT 4 หลักคือ WWYY (สัปดาห์+ปี ค.ศ. 2 หลักท้าย) เช่น 0126 = สัปดาห์ 1 ปี 2026
  const tireLotSummary = (() => {
    if (!isTire) return [];

    const rows = new Map();
    for (const lot of currentItem.tireLots || []) {
      const label = String(lot.dotCode ?? "").trim() || "ไม่ระบุ";
      const quantity = Number(lot.quantity) || 0;
      const sortKey = dotOrderKey(label);

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

    // ไม่ได้สต็อกไว้ → เหลือเท่าไหร่ก็ปกติ ไม่มีเกณฑ์ให้เทียบ
    if (!tracksStock(currentItem.minStockLevel)) {
      return {
        color: "bg-subtle-light",
        textColor: "text-subtle-dark",
        Icon: Info,
        label: `ไม่เก็บสต็อก · จำนวน ${amount}`,
      };
    }
    if (quantity === 0) {
      return {
        color: "bg-destructive",
        textColor: "text-destructive",
        Icon: AlertTriangle,
        label: "สต็อกหมด",
      };
    }
    if (quantity < Number(currentItem.minStockLevel)) {
      return {
        color: "bg-status-progress",
        textColor: "text-status-progress",
        Icon: AlertTriangle,
        label: `สต็อกต่ำ · จำนวน ${amount}`,
      };
    }
    return {
      color: "bg-status-completed",
      textColor: "text-status-completed",
      Icon: Check,
      label: `สต็อกปกติ · จำนวน ${amount}`,
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
    const addedLots = isTire
      ? (data.tireLots || []).map((lot) => ({
          dotCode: String(lot.dotCode || "").trim(),
          quantity: Number(lot.quantity) || 0,
        }))
      : [];
    const addedQuantity = isTire
      ? addedLots.reduce((sum, lot) => sum + lot.quantity, 0)
      : Number(data.quantity);

    setIsSubmitting(true);
    try {
      await updatePartStock(currentItem.id, {
        quantity: isTire ? undefined : addedQuantity,
        lots: isTire ? addedLots : undefined,
      });
      toast.success("เพิ่มสต็อกเรียบร้อยแล้ว");
      setIsAddStockVisible(false);
      resetStockForm();

      const updatedItem = {
        ...currentItem,
        stockQuantity: currentItem.stockQuantity + addedQuantity,
        tireLots: isTire
          ? mergeTireLots(currentItem.tireLots, addedLots)
          : currentItem.tireLots,
      };
      setCurrentItem(updatedItem);

      scrollDialogTo(0);

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
                  <div className="border-input flex aspect-square w-full max-w-[280px] items-center justify-center overflow-hidden rounded-[20px] border-2">
                    <img
                      src={currentItem.secureUrl}
                      alt={currentItem.name}
                      className="h-full w-full object-contain"
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
                          className={`text-lg font-semibold md:text-xl ${stockStatus.textColor}`}
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
                            สัปดาห์/ปีผลิต:
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
                      รถที่ใช้ได้
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

              {!isService && (
                // ย่อ/ขยายด้วย CSS แทนการถอดออกจาก DOM ทันที ไม่งั้นไดอะล็อกหดวูบ
                // inert กันไม่ให้ Tab เข้าไปในช่องที่ถูกซ่อนอยู่
                <div
                  inert={!isAddStockVisible}
                  onTransitionEnd={handleAddStockTransitionEnd}
                  // grid-rows 0fr→1fr ขยายไปหา "ความสูงจริงของเนื้อหา" ไม่ต้องเดาเป็นตัวเลข
                  // (max-h ตายตัวจะตัดแถวที่เกินทิ้ง พอกรอกได้หลายล็อตแล้วเกินง่ายมาก)
                  className={`grid transition-all duration-200 ${
                    isAddStockVisible
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="font-athiti text-normal mt-[16px] mb-[8px] text-[22px] font-semibold md:text-2xl">
                      เพิ่มสต็อก
                    </p>

                    <div className="rounded-[10px] bg-gray-50 px-[16px] pb-[16px]">
                      <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-[16px]"
                      >
                        {/* ยางรับเข้าทีละหลาย DOT ได้ ใช้ตัวกรอกชุดเดียวกับฟอร์มเพิ่ม/แก้ไขรายการ */}
                        {isTire ? (
                          <TireLotInput
                            control={control}
                            register={register}
                            watch={watch}
                            errors={errors}
                            unit={currentItem.unit}
                            heading="สัปดาห์/ปีผลิต"
                            headingClass="text-lg md:text-xl"
                            className="pt-[16px]"
                          />
                        ) : (
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
                        )}

                        {/* เผยฟอร์มแล้วต้องมีทางถอย — ปุ่มยกเลิกใช้สไตล์เดียวกับไดอะล็อกอื่น
                          (ขาว+ขอบ ไม่ใช่พื้นเทา เพราะกล่องฟอร์มเป็น bg-gray-50 จะกลืนกัน) */}
                        <div className="flex items-center gap-[16px]">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleCancelAddStock}
                            // พื้นขาว+ขอบ ไม่ใช่พื้นเทา เพราะกล่องฟอร์มเป็น bg-gray-50 อยู่แล้วจะกลืนกัน
                            // กว้างครึ่งเดียวของปุ่มหลัก — เป็นทางถอย ไม่ใช่สิ่งที่ตั้งใจมากด
                            className="font-athiti border-subtle-light bg-surface text-subtle-dark flex h-[41px] flex-1 cursor-pointer items-center justify-center rounded-[20px] border text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-70 md:text-xl"
                          >
                            ยกเลิก
                          </button>

                          <FormButton
                            label={
                              isSubmitting ? (
                                "เพิ่มสต็อก"
                              ) : (
                                <div className="flex items-center justify-center gap-[8px]">
                                  <Plus className="h-4 w-4" />
                                  เพิ่มสต็อก
                                </div>
                              )
                            }
                            isLoading={isSubmitting}
                            className="font-athiti bg-gradient-primary mr-0 ml-0 flex-[2]"
                          />
                        </div>
                      </form>
                    </div>
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
                  className="font-athiti text-surface bg-gradient-primary flex h-11 flex-1 cursor-pointer items-center justify-center gap-[4px] rounded-[20px] text-lg font-semibold md:text-xl"
                >
                  <Plus className="h-4 w-4" />
                  เพิ่มสต็อก
                </button>
              )}
              <button
                onClick={handleEdit}
                autoFocus={false}
                className="font-athiti text-surface bg-status-progress flex h-11 flex-1 cursor-pointer items-center justify-center gap-[4px] rounded-[20px] text-lg font-semibold md:text-xl"
              >
                <Edit className="h-4 w-4" />
                แก้ไข
              </button>
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="font-athiti text-surface bg-destructive flex h-11 w-11 cursor-pointer items-center justify-center rounded-[20px] text-lg font-semibold md:text-xl"
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
        title={isService ? "ยืนยันการลบบริการ" : "ยืนยันการลบอะไหล่"}
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
            // ของถูกลบแล้ว ไดอะล็อกรายละเอียดไม่มีอะไรให้ดูต่อ ปิดทั้งสองชั้น
            setIsDeleteConfirmOpen(false);
            onOpenChange(false);
          } catch (error) {
            // ลบไม่สำเร็จ: ปิดแค่ตัวยืนยัน ให้ผู้ใช้ยังเห็นรายละเอียดและลองใหม่ได้
            toastError(error);
            setIsDeleteConfirmOpen(false);
          }
        }}
      />
    </div>
  );
};

export default RepairItemDetailDialog;
