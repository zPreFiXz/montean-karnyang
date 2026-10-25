import { useState, useEffect, useCallback, useRef } from "react";
import DialogTitleBar from "@/components/dialogs/DialogTitleBar";
import { saveScrollPosition } from "@/utils/scrollPosition";
import {
  Edit,
  Plus,
  AlertTriangle,
  Check,
  Info,
  Trash,
  History,
  ShoppingCart,
} from "lucide-react";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import FormInput from "@/components/forms/FormInput";
import TireLotInput from "@/components/forms/TireLotInput";
import DescriptionNote from "@/components/ui/DescriptionNote";
import FormButton from "@/components/forms/FormButton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updatePartStock, deletePart } from "@/api/part";
import { deleteService } from "@/api/service";
import { useNavigate } from "react-router";
import { markStockItemOpen } from "@/hooks/useReopenStockItem";
import { updateStockSchema } from "@/utils/schemas";
import useAuthStore from "@/stores/useAuthStore";
import { formatProductName } from "@/utils/tireSize";
import {
  isTireCategoryName,
  tracksTireLots,
  USED_TIRE_CATEGORY,
} from "@/constants/categories";
import { isPartLikeItem } from "@/constants/services";
import { toastError } from "@/utils/handleError";
import { withMinDuration } from "@/utils/withMinDuration";
import { stockStatusOf } from "@/utils/inventoryItem";
import ItemInfoSections from "@/components/inventory/ItemInfoSections";
import ItemImage from "@/components/ui/ItemImage";
import { SparePart } from "@/components/icons/Icons";

const STOCK_TONES = {
  out: {
    color: "bg-destructive",
    textColor: "text-destructive",
    Icon: AlertTriangle,
  },
  low: {
    color: "bg-status-progress",
    textColor: "text-status-progress",
    Icon: AlertTriangle,
  },
  ok: {
    color: "bg-status-completed",
    textColor: "text-status-completed",
    Icon: Check,
  },
  untracked: {
    color: "bg-subtle-light",
    textColor: "text-subtle-dark",
    Icon: Info,
  },
};

// ทำแบบเดียวกับ backend ตอนเพิ่มสต็อก: DOT เดิมบวกทับล็อตเดิม ไม่งั้นสร้างล็อตใหม่
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
  const [isStockFormShown, setIsStockFormShown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(item);
  const isTire = isTireCategoryName(currentItem?.category?.name);
  // ยางเปอร์เซ็นต์เป็นยางแต่ไม่มีล็อตสัปดาห์/ปีผลิต เพิ่มสต็อกเป็นจำนวนเหมือนอะไหล่ทั่วไป
  const tracksLots = tracksTireLots(currentItem?.category?.name);
  const isUsedTire = currentItem?.category?.name === USED_TIRE_CATEGORY;
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

  // ฟอร์มแค่ยุบด้วย CSS ไม่ได้ unmount reset() เปล่าๆ จะล้างแถวยางจนหมด
  // และค่าในช่องจำนวนจะค้างจากชิ้นก่อน จึงต้องใส่ค่าให้เอง
  const resetStockForm = useCallback(() => {
    reset(
      tracksLots
        ? { tireLots: [{ dotCode: "", quantity: "" }] }
        : { quantity: "" },
    );
  }, [reset, tracksLots]);

  useEffect(() => {
    if (!open) {
      setIsAddStockVisible(false);
      setIsStockFormShown(false);
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

  // เลื่อนกลับขึ้นบนไม่ต้องรอ ถ้าหน่วงจะเห็นหุบฟอร์มกับเลื่อนเป็นสองจังหวะ
  const scrollDialogTo = (top, delay = 0) => {
    const run = () => dialogScroller()?.scrollTo({ top, behavior: "smooth" });
    if (delay) setTimeout(run, delay);
    else run();
  };

  // ล็อกความสูงไดอะล็อกไว้ก่อนเปิดฟอร์ม ไม่งั้นตัวที่ไม่มีรูปจะยืดหดทั้งกล่อง
  const contentRef = useRef(null);
  const lockDialogHeight = () => {
    const el = contentRef.current;
    if (el) el.style.height = `${el.getBoundingClientRect().height}px`;
  };
  const unlockDialogHeight = () => {
    if (contentRef.current) contentRef.current.style.height = "";
  };

  const handleShowAddStock = () => {
    lockDialogHeight();
    setIsAddStockVisible(true);
    setIsStockFormShown(true);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const scroller = dialogScroller();
        scroller?.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
      }),
    );
  };

  // เลื่อนขึ้นก่อนแล้วค่อยเอาฟอร์มออก ไม่งั้นเนื้อหาหดใต้มือ
  const closeAddStock = () => {
    setIsAddStockVisible(false);
    scrollDialogTo(0);
    setTimeout(() => {
      setIsStockFormShown(false);
      resetStockForm();
      unlockDialogHeight();
    }, 300);
  };

  const handleCancelAddStock = () => {
    closeAddStock();
  };

  if (!currentItem) return null;

  const isOilKit = !!(currentItem.oilSourceId && currentItem.oilSource);

  const isService = currentItem.type === "service";
  // จุ๊บลมเก็บเป็นบริการแต่เรียกว่าอะไหล่ (ดู PART_LIKE_SERVICE_NAMES)
  const readsAsService = isService && !isPartLikeItem(currentItem);

  const stockStatus = {
    ...STOCK_TONES[stockStatusOf(currentItem, isOilKit).tone],
    label: stockStatusOf(currentItem, isOilKit).label,
  };

  const itemDisplayName = (() => {
    if (isService) return `${currentItem.name}`;

    return formatProductName({
      brand: currentItem.brand,
      name: currentItem.name,
      attributes: currentItem.attributes,
      isTire,
      isUsedTire,
    });
  })();

  const renderProductInfo = () => (
    <h2 className="font-athiti text-normal text-center text-[22px] leading-tight font-semibold break-words md:text-2xl">
      {itemDisplayName}
    </h2>
  );

  // แทนที่รายการเดิมในประวัติ กดย้อนกลับมาไดอะล็อกจึงเปิดค้างไว้
  const rememberOpenItem = () => {
    // หน้าอื่นไม่รู้จักพารามิเตอร์นี้ จึงฝากไว้ใน state ของประวัติแทน (ดู useReopenStockItem)
    if (window.location.pathname !== "/inventory") {
      const current = `${window.location.pathname}${window.location.search}`;
      saveScrollPosition(current);
      markStockItemOpen(currentItem);
      return current;
    }

    const params = new URLSearchParams(window.location.search);
    params.set("item", `${currentItem.type}-${currentItem.id}`);
    const returnTo = `${window.location.pathname}?${params}`;
    // แนบข้อมูลไปด้วยให้เปิดได้ตั้งแต่เฟรมแรก ค่าใน URL เป็นทางสำรองตอนรีเฟรช
    navigate(returnTo, { replace: true, state: { openItem: currentItem } });
    return returnTo;
  };

  const handleEdit = () => {
    onOpenChange(false);
    const from = encodeURIComponent(rememberOpenItem());
    navigate(
      `/inventory/${currentItem.id}?type=${currentItem.type}&from=${from}`,
    );
  };

  const handleShowUsage = () => {
    onOpenChange(false);
    const returnTo = rememberOpenItem();
    const params = new URLSearchParams({
      name: formatProductName({
        name: currentItem.name,
        attributes: currentItem.attributes,
        isTire,
        isUsedTire,
      }),
      ...(isService || isUsedTire || !currentItem.brand
        ? {}
        : { brand: currentItem.brand }),
      from: returnTo,
    });
    navigate(
      `/inventory/${currentItem.type === "service" ? "service" : "part"}/${currentItem.id}/usage?${params}`,
    );
  };

  const onSubmit = async (data) => {
    const addedLots = tracksLots
      ? (data.tireLots || []).map((lot) => ({
          dotCode: String(lot.dotCode || "").trim(),
          quantity: Number(lot.quantity) || 0,
        }))
      : [];
    const addedQuantity = tracksLots
      ? addedLots.reduce((sum, lot) => sum + lot.quantity, 0)
      : Number(data.quantity);

    setIsSubmitting(true);
    try {
      await withMinDuration(() =>
        updatePartStock(currentItem.id, {
          quantity: tracksLots ? undefined : addedQuantity,
          lots: tracksLots ? addedLots : undefined,
        }),
      );
      toast.success("เพิ่มสต็อกเรียบร้อยแล้ว");

      const updatedItem = {
        ...currentItem,
        stockQuantity: currentItem.stockQuantity + addedQuantity,
        tireLots: tracksLots
          ? mergeTireLots(currentItem.tireLots, addedLots)
          : currentItem.tireLots,
      };
      setCurrentItem(updatedItem);

      closeAddStock();

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
          ref={contentRef}
          className="flex max-h-[85svh] w-full flex-col p-0"
          showCloseButton={false}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
          <DialogTitleBar
            title={<>รายละเอียด{readsAsService ? "บริการ" : "อะไหล่"}</>}
            description={
              <>
                แสดงข้อมูลรายละเอียด{readsAsService ? "บริการ" : "อะไหล่"}{" "}
                {currentItem.brand} {currentItem.name}
              </>
            }
            onClose={() => onOpenChange(false)}
            leftSlot={
              <>
                <button
                  onClick={handleShowUsage}
                  autoFocus={false}
                  aria-label="ประวัติการใช้"
                  title="ประวัติการใช้"
                  className="bg-primary/10 absolute top-1/2 left-5 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full"
                >
                  <History size={20} className="text-primary" />
                </button>
              </>
            }
          />

          <div className="font-athiti flex flex-1 flex-col overflow-y-auto">
            <div className="flex-1 px-5">
              <div className="mb-4">
                {renderProductInfo()}

                {!isService && currentItem.partNumber && (
                  <div className="mt-4 flex justify-center">
                    <div
                      className={`text-surface ${stockStatus.color} flex h-[41px] w-fit items-center gap-2 rounded-[20px] px-6 text-base font-semibold md:text-lg`}
                    >
                      <stockStatus.Icon className="h-4 w-4" />
                      {stockStatus.label}
                    </div>
                  </div>
                )}
              </div>

              {currentItem.secureUrl && (
                <div className="mb-4 flex justify-center">
                  <div className="border-input flex aspect-square w-full max-w-70 items-center justify-center overflow-hidden rounded-[20px] border-2">
                    <ItemImage
                      src={currentItem.secureUrl}
                      alt={currentItem.name}
                      className="h-full w-full object-contain"
                      fallback={
                        <SparePart className="text-subtle-light h-20 w-20" />
                      }
                    />
                  </div>
                </div>
              )}

              {currentItem.description && (
                <DescriptionNote text={currentItem.description} />
              )}

              <ItemInfoSections
                item={currentItem}
                isService={isService}
                isOilKit={isOilKit}
                tracksLots={tracksLots}
                showCost={user?.role === "ADMIN"}
                stockTextColor={stockStatus.textColor}
              />

              {!isService && (
                // ยุบด้วย CSS ไม่ถอดออกจาก DOM ไม่งั้นไดอะล็อกหดวูบ inert กัน Tab เข้าช่องที่ซ่อน
                <div
                  inert={!isAddStockVisible}
                  // grid-rows 0fr→1fr ขยายตามความสูงจริง max-h ตายตัวจะตัดแถวล็อตที่เกิน
                  className={`grid ${
                    isStockFormShown
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="font-athiti text-normal mt-4 mb-2 text-[22px] font-semibold md:text-2xl">
                      เพิ่มสต็อก
                    </p>

                    <div className="rounded-lg bg-gray-50 px-4 pb-4">
                      <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4"
                      >
                        {tracksLots ? (
                          <TireLotInput
                            control={control}
                            register={register}
                            watch={watch}
                            errors={errors}
                            unit={currentItem.unit}
                            heading="สัปดาห์/ปีผลิต"
                            headingClass="text-lg md:text-xl"
                            className="pt-4"
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
                            customClass="px-0 pt-4"
                          />
                        )}

                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleCancelAddStock}
                            className="font-athiti bg-surface text-subtle-dark border-subtle-light flex h-[41px] flex-1 cursor-pointer items-center justify-center rounded-[20px] border text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-70 md:text-xl"
                          >
                            ยกเลิก
                          </button>

                          <FormButton
                            label={
                              isSubmitting ? (
                                "เพิ่มสต็อก"
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <Plus className="h-4 w-4" />
                                  เพิ่มสต็อก
                                </div>
                              )
                            }
                            isLoading={isSubmitting}
                            className="font-athiti bg-gradient-primary mr-0 ml-0 flex-1"
                          />
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 px-4 pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  navigate("/repairs/new", {
                    state: { addItem: currentItem },
                  })
                }
                disabled={
                  !!currentItem.partNumber && !(currentItem.stockQuantity > 0)
                }
                aria-label="เพิ่มลงรายการซ่อม"
                title="เพิ่มลงรายการซ่อม"
                className="font-athiti text-primary bg-primary-soft flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-[20px] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ShoppingCart className="h-4 w-4" />
              </button>
              {!isService && !isOilKit && !isAddStockVisible && (
                <button
                  onClick={handleShowAddStock}
                  className="font-athiti text-surface bg-gradient-primary flex h-11 flex-1 cursor-pointer items-center justify-center gap-1 rounded-[20px] text-lg font-semibold md:text-xl"
                >
                  <Plus className="h-4 w-4" />
                  เพิ่มสต็อก
                </button>
              )}
              <button
                onClick={handleEdit}
                autoFocus={false}
                className="font-athiti text-primary border-primary bg-surface flex h-11 flex-1 cursor-pointer items-center justify-center gap-1 rounded-[20px] border text-lg font-semibold md:text-xl"
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
            setIsDeleteConfirmOpen(false);
            onOpenChange(false);
          } catch (error) {
            toastError(error);
            setIsDeleteConfirmOpen(false);
          }
        }}
      />
    </div>
  );
};

export default RepairItemDetailDialog;
