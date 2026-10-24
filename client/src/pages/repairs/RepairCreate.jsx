import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  X,
  ClipboardList,
  LoaderCircle,
  ChevronLeft,
} from "lucide-react";
import FormInput from "@/components/forms/FormInput";
import AddRepairItemDialog from "@/components/dialogs/AddRepairItemDialog";
import EditRepairItemDialog from "@/components/dialogs/EditRepairItemDialog";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { scrollToNewRow } from "@/utils/scrollToNewRow";
import BillTotal from "@/components/bill/BillTotal";
import CustomerInfoSection from "@/components/bill/CustomerInfoSection";
import VehicleFields from "@/components/bill/VehicleFields";
import FormButton from "@/components/forms/FormButton";
import { listParts } from "@/api/part";
import { repairSchema } from "@/utils/schemas";
import { SUSPENSION_CATEGORY } from "@/constants/categories";
import { isPartLikeItem, isDiscountItem } from "@/constants/services";
import {
  collapseSidePairs,
  countDisplayedItems,
} from "@/utils/repairItemGroups";
import useBillNavigation from "@/hooks/useBillNavigation";
import useVehicleModels from "@/hooks/useVehicleModels";
import { focusFirstInvalid } from "@/utils/focusInvalidField";
import { EMPTY_FORM, SUBMIT_FEEDBACK_MS } from "@/constants/billForm";
import useBillItems from "@/hooks/useBillItems";
import { getProductName } from "@/utils/billItems";
import BillItemRows from "@/components/bill/BillItemRows";
import BillItemDialogs from "@/components/bill/BillItemDialogs";
import {
  FreebieButton,
  ReorderButton,
} from "@/components/bill/BillItemButtons";
import {
  DRAFT_REPAIR,
  loadDraft,
  saveDraft,
  clearDraft,
  isDraftWorthSaving,
} from "@/utils/repairDraft";
import { usePrefetchPages } from "@/routes/pageImports";

const VEHICLE_FIELDS = [
  "brand",
  "model",
  "plateLetters",
  "plateNumbers",
  "province",
  "fleetNo",
  "mileage",
];
const RepairCreate = () => {
  usePrefetchPages(["RepairReview"]);

  const navigate = useNavigate();
  const {
    isEditing,
    canReturnToVehicle,
    handleCancelEdit,
    handleBackToVehicle,
  } = useBillNavigation(DRAFT_REPAIR);
  const { brands, modelsForBrand } = useVehicleModels();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    formState,
    setValue,
    watch,
    getValues,
    reset,
    trigger,
  } = useForm({
    resolver: zodResolver(repairSchema),
  });
  const [clearCount, setClearCount] = useState(0);
  const [isCustomerInfoOpen, setIsCustomerInfoOpen] = useState(false);
  // SERVICE = งานที่ไม่ต้องเก็บประวัติรถ ตอนบันทึกเป็น GENERAL แต่ส่ง noVehicle ไปด้วย
  const [billType, setBillType] = useState("GENERAL");
  const isSale = billType === "SALE";
  const isService = billType === "SERVICE";
  const hasNoVehicle = isSale || isService;
  const bill = useBillItems();
  const {
    repairItems,
    setRepairItems,
    withRowId,
    handleAddItemToRepair,
    updateItemPrice,
  } = bill;
  const [isLoading, setIsLoading] = useState(false);
  const [restoredStockMap, setRestoredStockMap] = useState({});
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // กู้ร่างได้ครั้งเดียวตอนเปิดหน้า ไม่งั้นร่างที่บันทึกระหว่างพิมพ์จะย้อนทับสิ่งที่พิมพ์อยู่
  const draftRestoredRef = useRef(false);
  // ข้อมูลรถที่ถูกล้างตอนสลับไปโหมดที่ไม่ผูกรถ เก็บไว้คืนให้เมื่อสลับกลับมา
  const vehicleFieldsRef = useRef({});
  const { errors } = formState;

  // null = ยังโหลดไม่เสร็จ ระหว่างนั้นไม่ปิดปุ่ม
  const [modelsWithParts, setModelsWithParts] = useState(null);
  const [isCheckingSuspension, setIsCheckingSuspension] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchModelsWithParts();
  }, []);

  useEffect(() => {
    // ไม่มีข้อมูลบิลติดมา = เข้าหน้าตรงๆ ให้กู้จากร่าง (ปุ่มตะกร้าก็มาแบบนี้ ดู cartItemHandledRef)
    // แก้บิลเดิมไม่มีร่างของตัวเอง ห้ามหยิบร่างบิลใหม่มาใส่
    const navState =
      location.state?.repairData || location.state?.repairItems
        ? location.state
        : null;
    const restored =
      navState ||
      (!isEditing && !draftRestoredRef.current && loadDraft(DRAFT_REPAIR));
    draftRestoredRef.current = true;
    if (restored && !navState) toast.info("กู้คืนข้อมูลที่กรอกค้างไว้แล้ว");

    if (restored) {
      const { repairData, repairItems: savedItems } = restored;

      if (repairData) {
        Object.keys(repairData).forEach((key) => {
          setValue(key, repairData[key]);
        });
        // SUSPENSION มาจากหน้าเช็กช่วงล่าง ไม่ได้แก้ในหน้านี้ จึงถือเป็นงานซ่อมเหมือนกัน
        if (repairData.type === "SALE") setBillType("SALE");
        else if (repairData.noVehicle) setBillType("SERVICE");
      }

      if (savedItems && savedItems.length > 0) {
        // แก้บิลที่บันทึกแล้ว ของถูกหักไปแล้ว ต้องบวกคืนตอนคิดว่าเบิกได้เท่าไหร่
        const map = {};
        if (location.state?.editRepairId && !location.state?.stockNotDeducted) {
          for (const it of savedItems) {
            if (it?.partNumber && typeof it.quantity === "number") {
              const key =
                it.id != null
                  ? `id:${it.id}`
                  : `${it.partNumber}|${it.brand}|${it.name || ""}`;
              map[key] = (map[key] || 0) + it.quantity;
            }
          }
        }
        setRestoredStockMap(map);

        // รายการที่กู้คืนมาไม่ได้ผ่านไดอะล็อก จึงยังไม่มีเพดานของปุ่มบวกติดมาด้วย
        setRepairItems(
          collapseSidePairs(savedItems)
            .map(withRowId)
            .map((it) => {
              if (it.availableStock !== undefined) return it;
              const key =
                it.id != null
                  ? `id:${it.id}`
                  : `${it.partNumber}|${it.brand}|${it.name || ""}`;
              return {
                ...it,
                availableStock: (it.stockQuantity || 0) + (map[key] || 0),
                basePrice: it.basePrice ?? it.sellingPrice,
              };
            }),
        );
      }

      if (location.state?.scrollToItems) {
        scrollToNewRow(() => {
          const headers = document.querySelectorAll("[data-repair-items-top]");
          return [...headers].find((el) => el.offsetParent !== null);
        }, "start");
      }

      const preserved = {
        ...(location.state?.editRepairId
          ? {
              editRepairId: location.state.editRepairId,
              stockNotDeducted: location.state.stockNotDeducted,
              backIdx: location.state.backIdx,
            }
          : {}),
        ...(!location.state?.editRepairId && location.state?.backIdx != null
          ? { backIdx: location.state.backIdx }
          : {}),
        ...(location.state?.origin ? { origin: location.state.origin } : {}),
        ...(location.state?.from ? { from: location.state.from } : {}),
        ...(location.state?.statusSlug
          ? { statusSlug: location.state.statusSlug }
          : {}),
        ...(location.state?.vehicleId
          ? { vehicleId: location.state.vehicleId }
          : {}),
      };
      if (location.state) {
        // ต้องคงฟิลด์ของ router ไว้ ลำดับหน้าในประวัติอยู่ในนั้น
        window.history.replaceState(
          { ...window.history.state, usr: preserved },
          document.title,
          window.location.pathname,
        );
      }
    }
    // withRowId สร้างใหม่ทุกเรนเดอร์ ใส่ไว้จะกู้ซ้ำไม่หยุด
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, setValue, isEditing]);

  useEffect(() => {
    setValue("type", isSale ? "SALE" : "GENERAL");
    setValue("noVehicle", hasNoVehicle);
  }, [billType, isSale, hasNoVehicle, setValue]);

  const watchedValues = watch();
  const draftKey = JSON.stringify({ watchedValues, repairItems });

  useEffect(() => {
    if (isEditing || !draftRestoredRef.current) return;

    const timer = setTimeout(() => {
      const draft = { repairData: watchedValues, repairItems };
      if (isDraftWorthSaving(draft)) saveDraft(DRAFT_REPAIR, draft);
      else clearDraft(DRAFT_REPAIR);
    }, 400);

    return () => clearTimeout(timer);
    // ใส่ค่าเหล่านี้ตรงๆ ตัวจับเวลาจะถูกตั้งใหม่ทุกเรนเดอร์ draftKey แทนอยู่แล้ว
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, isEditing]);

  // เกณฑ์เดียวกับที่หน้าเช็กช่วงล่างใช้แสดงอะไหล่
  const fetchModelsWithParts = async () => {
    try {
      const res = await listParts();
      const keys = new Set();
      (res.data || []).forEach((part) => {
        if (part.category?.name !== SUSPENSION_CATEGORY) return;
        (part.compatibleVehicles || []).forEach((vehicle) => {
          keys.add(`${vehicle.brand}|${vehicle.model}`);
        });
      });
      setModelsWithParts(keys);
    } catch {
      setModelsWithParts(null);
    }
  };

  const hasSuspensionParts =
    !modelsWithParts ||
    !watch("brand") ||
    !watch("model") ||
    modelsWithParts.has(`${watch("brand")}|${watch("model")}`);

  const plateText =
    watch("plateLetters") && watch("plateNumbers")
      ? `${watch("plateLetters")} ${watch("plateNumbers")}`
      : "";

  // ยกทั้งข้อมูลรถและรายการไปด้วย ให้อยู่ในบิลเดียวกัน
  const handleAddSuspensionCheck = async () => {
    setIsCheckingSuspension(true);
    await new Promise((resolve) => setTimeout(resolve, SUBMIT_FEEDBACK_MS));
    setIsCheckingSuspension(false);

    if (!watch("brand") || !watch("model")) {
      await trigger(["brand", "model"]);
      onInvalid(watch("brand") ? { model: true } : { brand: true });
      return;
    }

    if (!hasSuspensionParts) {
      toast.error("ไม่มีอะไหล่ช่วงล่างของรถรุ่นนี้");
      return;
    }

    // ร่างของหน้านี้หมดหน้าที่ ปล่อยไว้จะกลายเป็นร่างเก่าคอยดักอยู่
    clearDraft(DRAFT_REPAIR);

    navigate("/inspections/suspension", {
      state: {
        repairData: getValues(),
        repairItems,
        scrollToItems: !!(watch("brand") && watch("model")),
        // เพิ่งเปลี่ยนเป็นงานช่วงล่าง ยังไม่มีค่าแรงกับตั้งศูนย์ที่บิลช่วงล่างใส่ให้เสมอ
        addSuspensionDefaults: true,
        editRepairId: location.state?.editRepairId,
        stockNotDeducted: location.state?.stockNotDeducted,
        backIdx: location.state?.backIdx,
        from: location.state?.from,
        origin: location.state?.origin,
        statusSlug: location.state?.statusSlug,
        vehicleId: location.state?.vehicleId,
        returnTo: location.state?.returnTo,
        currentDate: location.state?.currentDate,
      },
    });
  };

  const handleClearForm = () => {
    reset(EMPTY_FORM);
    setClearCount((count) => count + 1);
    setRepairItems([]);
    setRestoredStockMap({});
    // สำเนาข้อมูลรถต้องทิ้งด้วย ไม่งั้นสลับโหมดไปกลับแล้วรถคันเดิมจะโผล่มาเอง
    vehicleFieldsRef.current = {};
    setIsCustomerInfoOpen(false);
    clearDraft(DRAFT_REPAIR);
    setIsClearConfirmOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChangeBillType = (nextType) => {
    const leavingVehicleMode = nextType === "SALE" || nextType === "SERVICE";

    setBillType(nextType);

    // ไม่ล้าง ค่าที่ค้างไว้จะถูกส่งไปสร้างรถผี แต่เก็บสำเนาไว้คืนตอนสลับกลับ
    if (leavingVehicleMode) {
      // เก็บเฉพาะตอนออกจากโหมดงานซ่อม ไม่งั้นช่องเปล่าจะทับสำเนา
      if (billType === "GENERAL") {
        const kept = {};
        for (const field of VEHICLE_FIELDS) {
          kept[field] = getValues(field);
        }
        vehicleFieldsRef.current = kept;
      }

      for (const field of VEHICLE_FIELDS) {
        setValue(field, "", { shouldValidate: false });
      }
      return;
    }

    for (const [field, value] of Object.entries(vehicleFieldsRef.current)) {
      setValue(field, value, { shouldValidate: false });
    }
  };

  const hasAnythingToClear =
    repairItems.length > 0 ||
    isDraftWorthSaving({ repairData: watchedValues, repairItems });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, SUBMIT_FEEDBACK_MS));

      navigate("/repairs/review", {
        state: {
          repairData: {
            ...data,
            type: isSale ? "SALE" : "GENERAL",
            noVehicle: hasNoVehicle,
          },
          repairItems: repairItems,
          editRepairId: location.state?.editRepairId,
          // ใบประเมินราคายังไม่เคยเบิกของ ต้องติดไปกลับด้วย ไม่งั้นย้อนกลับมาจะบวกสต็อกคืนเกิน
          stockNotDeducted: location.state?.stockNotDeducted,
          backIdx: location.state?.backIdx,
          origin: location.state?.origin || location.state?.from,
          statusSlug: location.state?.statusSlug,
          vehicleId: location.state?.vehicleId,
          returnTo: location.state?.returnTo,
          currentDate: location.state?.currentDate,
          from: "create",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onInvalid = (errs) =>
    focusFirstInvalid(errs, () => setIsCustomerInfoOpen(true));

  // ทำครั้งเดียวแล้วล้าง state ไม่งั้นรีเฟรชหรือย้อนกลับจะได้ของซ้ำ
  const cartItemHandledRef = useRef(false);
  useEffect(() => {
    const cartItem = location.state?.addItem;
    if (!cartItem || cartItemHandledRef.current) return;
    cartItemHandledRef.current = true;
    handleAddItemToRepair({
      ...cartItem,
      quantity: cartItem.stockQuantity ?? 0,
    });
    window.history.replaceState(
      { ...window.history.state, usr: null },
      document.title,
      window.location.pathname,
    );
    scrollToNewRow(() => {
      const headers = document.querySelectorAll("[data-repair-items-top]");
      return [...headers].find((el) => el.offsetParent !== null);
    }, "start");
    // handleAddItemToRepair สร้างใหม่ทุกเรนเดอร์ ทำครั้งเดียวก็พอ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const handlePriceClick = (index, item) => {
    setEditingItem({ index, ...item });
    setPriceDialogOpen(true);
  };

  const handlePriceConfirm = (payload) => {
    if (editingItem) updateItemPrice(editingItem.index, payload);
  };

  const itemsHeader = (
    <div
      data-repair-items-top
      className="flex items-center justify-between px-5 pt-4"
    >
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
          <ClipboardList className="text-primary h-5 w-5" />
        </div>
        <p className="text-[22px] font-semibold md:text-2xl">รายการซ่อม</p>
        <ReorderButton bill={bill} />
        <FreebieButton bill={bill} />
      </div>
      <AddRepairItemDialog
        onAddItem={handleAddItemToRepair}
        selectedItems={repairItems}
        restoredStockMap={restoredStockMap}
        vehicle={{ brand: watch("brand"), model: watch("model") }}
      >
        <p className="text-primary cursor-pointer text-lg font-semibold md:text-xl">
          + เพิ่มรายการซ่อม
        </p>
      </AddRepairItemDialog>
    </div>
  );

  const totalBox = (
    <BillTotal
      count={countDisplayedItems(repairItems)}
      total={repairItems.reduce(
        (total, item) => total + item.sellingPrice * item.quantity,
        0,
      )}
    />
  );

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-[100svh] flex-col xl:min-h-[calc(100vh-73px)] xl:flex-row xl:items-start xl:gap-4 xl:bg-transparent xl:px-4 xl:pt-6 xl:pb-6 xl:shadow-none">
      <div className="xl:shadow-primary flex flex-1 flex-col xl:h-fit xl:w-1/2 xl:flex-initial xl:rounded-2xl xl:bg-white">
        <div className="flex items-center justify-between gap-2 px-5 pt-4">
          <div className="flex min-w-0 items-center gap-2">
            {isEditing || canReturnToVehicle ? (
              <button
                type="button"
                onClick={isEditing ? handleCancelEdit : handleBackToVehicle}
                aria-label={
                  isEditing
                    ? "กลับไปหน้ารายละเอียดงานซ่อม"
                    : "กลับไปหน้าประวัติรถ"
                }
                className="bg-surface/20 xl:bg-primary/10 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
              >
                <ChevronLeft className="text-surface xl:hidden" />
                <ChevronLeft className="text-primary hidden xl:block" />
              </button>
            ) : (
              <div className="bg-surface/20 xl:bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <Plus color="#ffffff" className="xl:hidden" />
                <Plus className="text-primary hidden xl:block" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-surface xl:text-primary truncate text-2xl font-semibold md:text-[26px]">
                {isEditing
                  ? location.state?.stockNotDeducted
                    ? "แก้ไขใบประเมินราคา"
                    : isSale
                      ? "แก้ไขการขายอะไหล่"
                      : isService
                        ? "แก้ไขงานบริการ"
                        : "แก้ไขงานซ่อม"
                  : isSale
                    ? "ขายอะไหล่"
                    : isService
                      ? "งานบริการ"
                      : "งานซ่อมใหม่"}
              </p>
            </div>
          </div>
          {hasAnythingToClear && !isEditing && (
            <button
              type="button"
              onClick={() => setIsClearConfirmOpen(true)}
              className="text-destructive bg-surface flex shrink-0 cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-lg font-medium duration-300 md:text-xl xl:bg-transparent xl:px-0"
            >
              <X className="h-4 w-4" />
              ล้างข้อมูล
            </button>
          )}
        </div>
        <form
          id="repair-form"
          className="xl:[&_label]:text-normal xl:[&_.text-surface]:text-normal flex flex-1 flex-col"
          onSubmit={handleSubmit(onSubmit, onInvalid)}
        >
          <div className="mx-5 mt-4 flex gap-2">
            {[
              { id: "GENERAL", label: "งานซ่อม" },
              { id: "SERVICE", label: "งานบริการ" },
              { id: "SALE", label: "ขายอะไหล่" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleChangeBillType(option.id)}
                aria-pressed={billType === option.id}
                className={`h-[45px] flex-1 cursor-pointer rounded-lg border-2 text-lg font-semibold duration-300 md:text-xl ${
                  billType === option.id
                    ? "bg-surface text-primary border-white"
                    : "text-surface xl:text-subtle-dark border-white/50 xl:border-gray-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <CustomerInfoSection
            register={register}
            errors={errors}
            watch={watch}
            isOpen={isCustomerInfoOpen}
            onToggle={() => setIsCustomerInfoOpen(!isCustomerInfoOpen)}
            setValue={setValue}
          />
          {!hasNoVehicle && (
            <VehicleFields
              register={register}
              errors={errors}
              watch={watch}
              setValue={setValue}
              brands={brands}
              modelOptions={modelsForBrand(watch("brand"))}
              plateText={plateText}
              excludeRepairId={location.state?.editRepairId}
              fleetKey={clearCount}
            />
          )}
          <FormInput
            register={register}
            name="description"
            label={isSale ? "หมายเหตุ" : "รายละเอียดการซ่อม"}
            type="text"
            placeholder={
              isSale
                ? "เช่น สั่งของให้ลูกค้า ของถึงวันศุกร์แล้วโทรตาม"
                : "เช่น ค้างตั้งศูนย์ ลูกค้าจะมาวันเสาร์"
            }
            color="surface"
            errors={errors}
          />

          {!hasNoVehicle && (
            <div className="mt-4 flex justify-center px-5">
              <button
                type="button"
                onClick={handleAddSuspensionCheck}
                disabled={isCheckingSuspension}
                className="border-surface text-surface xl:border-primary xl:text-primary flex h-[41px] cursor-pointer items-center justify-center rounded-[20px] border px-5 text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-70 md:text-xl"
              >
                {isCheckingSuspension && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                เช็กช่วงล่างต่อ
              </button>
            </div>
          )}

          <div className="hidden pb-6 xl:block" />

          <div className="bg-surface shadow-primary mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl xl:hidden">
            {itemsHeader}
            {repairItems.length === 0 ? (
              <div className={hasNoVehicle ? "flex flex-1 flex-col" : ""}>
                <div
                  className={`flex items-center justify-center ${
                    hasNoVehicle ? "min-h-57 flex-1" : "h-57 xl:h-auto"
                  }`}
                >
                  <p className="text-subtle-light text-xl md:text-[22px]">
                    กรุณาเพิ่มรายการซ่อม
                  </p>
                </div>
                <div className="pb-23" />
              </div>
            ) : (
              <div className="pb-5">
                <BillItemRows
                  bill={bill}
                  onRowClick={handlePriceClick}
                  transitionPrefix="repair-item"
                />
                {totalBox}
                <div className="flex justify-center pb-23">
                  <FormButton label="ถัดไป" isLoading={isLoading} />
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      <div className="hidden w-1/2 xl:block">
        <div className="bg-surface shadow-primary h-fit rounded-2xl">
          {itemsHeader}
          {repairItems.length === 0 ? (
            <div>
              <div className="flex h-57 items-center justify-center">
                <p className="text-subtle-light text-xl md:text-[22px]">
                  กรุณาเพิ่มรายการซ่อม
                </p>
              </div>
            </div>
          ) : (
            <div>
              <BillItemRows
                bill={bill}
                onRowClick={handlePriceClick}
                transitionPrefix="repair-item"
              />

              {totalBox}
              <div className="flex justify-center pb-4">
                <FormButton
                  label="ถัดไป"
                  isLoading={isLoading}
                  form="repair-form"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <BillItemDialogs bill={bill} />
      <EditRepairItemDialog
        isOpen={priceDialogOpen}
        onClose={() => setPriceDialogOpen(false)}
        onConfirm={handlePriceConfirm}
        currentPrice={editingItem?.sellingPrice || 0}
        originalPrice={editingItem?.basePrice}
        productName={editingItem ? getProductName(editingItem) : ""}
        partNumber={editingItem?.partNumber}
        description={editingItem?.description}
        productImage={editingItem?.secureUrl}
        isService={editingItem?.category?.name === "บริการ"}
        // ใช้ชื่อเต็มแบบบนการ์ด เพราะชื่อที่พิมพ์เองคือทั้งบรรทัด
        currentName={editingItem ? getProductName(editingItem) : ""}
        canEditName
        isPartLine={isPartLikeItem(editingItem)}
        isDiscountLine={isDiscountItem(editingItem)}
      />

      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleClearForm}
        title="ยืนยันการล้างข้อมูล"
        requireHold={false}
        itemName="ข้อมูลที่กรอกไว้ทั้งหมด"
        confirmLabel="ล้างข้อมูล"
      />
    </div>
  );
};

export default RepairCreate;
