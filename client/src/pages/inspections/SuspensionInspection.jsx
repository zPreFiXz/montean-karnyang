import FormInput from "@/components/forms/FormInput";
import AddRepairItemDialog from "@/components/dialogs/AddRepairItemDialog";
import EditRepairItemDialog from "@/components/dialogs/EditRepairItemDialog";
import PartPreviewDialog from "@/components/dialogs/PartPreviewDialog";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { listParts } from "@/api/part";
import { listInventory } from "@/api/inventory";
import { ClipboardList, X, LoaderCircle, ChevronLeft } from "lucide-react";
import BillTotal from "@/components/bill/BillTotal";
import CustomerInfoSection from "@/components/bill/CustomerInfoSection";
import VehicleFields from "@/components/bill/VehicleFields";
import FormButton from "@/components/forms/FormButton";
import {
  DRAFT_SUSPENSION,
  loadDraft,
  saveDraft,
  clearDraft,
  isDraftWorthSaving,
} from "@/utils/repairDraft";
import { zodResolver } from "@hookform/resolvers/zod";
import { repairSchema } from "@/utils/schemas";
import { CarRepair } from "@/components/icons/Icons";
import { toastError } from "@/utils/handleError";
import {
  isPartLikeItem,
  isDiscountItem,
  SUSPENSION_DEFAULT_SERVICE_NAMES,
  PER_SIDE_SERVICE_NAME,
} from "@/constants/services";
import useBillNavigation from "@/hooks/useBillNavigation";
import useVehicleModels from "@/hooks/useVehicleModels";
import { focusFirstInvalid } from "@/utils/focusInvalidField";
import { EMPTY_FORM, SUBMIT_FEEDBACK_MS } from "@/constants/billForm";
import useSuspensionTabs from "@/hooks/useSuspensionTabs";
import SuspensionTabs from "@/components/suspension/SuspensionTabs";
import { SUSPENSION_TABS } from "@/utils/suspension";
import SuspensionPartPanel from "@/components/suspension/SuspensionPartPanel";
import useBillItems from "@/hooks/useBillItems";
import { getProductName } from "@/utils/billItems";
import BillItemRows from "@/components/bill/BillItemRows";
import BillItemDialogs from "@/components/bill/BillItemDialogs";
import {
  FreebieButton,
  ReorderButton,
} from "@/components/bill/BillItemButtons";
import { SUSPENSION_CATEGORY } from "@/constants/categories";
import {
  collapseSidePairs,
  expandBothSides,
  isSuspensionTabItem,
} from "@/utils/repairItemGroups";
import { scrollToNewRow } from "@/utils/scrollToNewRow";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { usePrefetchPages } from "@/routes/pageImports";

const thaiCollator = new Intl.Collator("th", { numeric: true });
const byPartName = (a, b) => thaiCollator.compare(a?.name || "", b?.name || "");

const SuspensionInspection = () => {
  usePrefetchPages(["RepairReview"]);

  const navigate = useNavigate();
  const {
    isEditing,
    canReturnToVehicle,
    handleCancelEdit,
    handleBackToVehicle,
  } = useBillNavigation(DRAFT_SUSPENSION);
  const { brands, modelsForBrand } = useVehicleModels();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(repairSchema),
  });
  const [clearCount, setClearCount] = useState(0);
  const bill = useBillItems({
    getReservedCount: (item) => getTabSelectedCountForItem(item),
  });
  const {
    repairItems,
    setRepairItems,
    withRowId,
    handleAddItemToRepair,
    updateItemPrice,
  } = bill;
  const [compatibleParts, setCompatibleParts] = useState([]);
  // เก็บแยกจากเซ็ตของอะไหล่ เพราะรหัสบริการกับรหัสอะไหล่เป็นคนละชุด ปนกันจะชนกัน
  const [perSideService, setPerSideService] = useState(null);
  const [isPartsLoaded, setIsPartsLoaded] = useState(false);
  const tabs = useSuspensionTabs({
    compatibleParts,
    perSideService,
    repairItems,
  });
  const {
    countSelectedInTabs,
    hasTabSelection,
    getPriceForPart,
    setPriceOverride,
    tabTotal,
    getTabSelectedCountForItem,
    getSelectedTabItems,
    buildTabItems,
    restoreTabs,
    matchItemsToTabs,
    addTabItems,
    clearTabs,
  } = tabs;
  const [activeTab, setActiveTab] = useState("left");
  const [slideFrom, setSlideFrom] = useState("right");
  const [isLoading, setIsLoading] = useState(false);
  const [restoredStockMap, setRestoredStockMap] = useState({});
  // จำนวนรายการซ่อมเพิ่มเติมที่อยู่ก่อนก้อนช่วงล่างในบิล
  // ไม่มีช่องในฐานข้อมูล อ่านกลับจากลำดับบรรทัด
  const [tabBlockIndex, setTabBlockIndex] = useState(0);

  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [previewPart, setPreviewPart] = useState(null);
  const restoredRef = useRef(false);
  const pendingHandoffRef = useRef(false);
  const [_isMoreFieldsVisible, setIsMoreFieldsVisible] = useState(false);
  const [isCustomerInfoOpen, setIsCustomerInfoOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  // กู้ร่างได้ครั้งเดียวตอนเปิดหน้า ไม่งั้นร่างที่บันทึกระหว่างพิมพ์จะย้อนทับสิ่งที่พิมพ์อยู่
  const draftRestoredRef = useRef(false);
  // หาจากชื่อ เพราะ id ไม่ตรงกันระหว่างเครื่อง
  const [defaultServices, setDefaultServices] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!isPartsLoaded) return;
    if (compatibleParts.length === 0) return;

    setRepairItems((prev) => {
      if (restoredRef.current) {
        restoredRef.current = false;
        return prev;
      }

      if (defaultServices.length === 0) return prev;

      const missing = defaultServices.filter(
        (service) =>
          !prev.some(
            (item) =>
              item?.category?.name === "บริการ" && item?.id === service.id,
          ),
      );
      if (missing.length === 0) return prev;

      return [
        ...prev,
        ...missing.map((service) =>
          withRowId({ ...service, quantity: 1, side: null }),
        ),
      ];
    });
    // withRowId สร้างใหม่ทุกเรนเดอร์ ใส่ไว้จะเติมวนไม่หยุด
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compatibleParts, isPartsLoaded, defaultServices]);

  useEffect(() => {
    let cancelled = false;

    listInventory("บริการ", null)
      .then((res) => {
        if (cancelled) return;

        const found = SUSPENSION_DEFAULT_SERVICE_NAMES.map((name) =>
          (res.data || []).find((item) => item.name === name),
        ).filter(Boolean);

        setDefaultServices(found);
        setPerSideService(
          (res.data || []).find(
            (item) => item.name === PER_SIDE_SERVICE_NAME,
          ) || null,
        );
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const brand = watch("brand");
    const model = watch("model");

    setIsPartsLoaded(false);

    if (brand && model) {
      fetchCompatibleParts(brand, model);
    } else {
      setCompatibleParts([]);
      setIsPartsLoaded(false);
    }
  }, [watch("brand"), watch("model")]);

  useEffect(() => {
    if (!isPartsLoaded) return;

    // รุ่นนี้ไม่มีอะไหล่ช่วงล่าง = เช็กตามตำแหน่งไม่ได้ เอาบรรทัดตั้งต้นออก
    if (compatibleParts.length === 0) {
      setRepairItems((prev) =>
        prev.filter(
          (item) =>
            !(
              item?.category?.name === "บริการ" &&
              SUSPENSION_DEFAULT_SERVICE_NAMES.includes(item?.name)
            ),
        ),
      );
    }
  }, [compatibleParts, isPartsLoaded, setRepairItems]);

  // มาจากปุ่มเช็กช่วงล่างต่อ: รอรายการอะไหล่ของรุ่นนี้โหลดเสร็จก่อนถึงจะรู้ว่าตัวไหนอยู่ในแท็บ
  useEffect(() => {
    if (!isPartsLoaded || !pendingHandoffRef.current) return;
    pendingHandoffRef.current = false;

    const { tabItems, movedRowIds } = matchItemsToTabs(repairItems);
    if (movedRowIds.length === 0) return;
    addTabItems(tabItems);
    setRepairItems((prev) =>
      prev.filter((item) => !movedRowIds.includes(item.rowId)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPartsLoaded, compatibleParts]);

  useEffect(() => {
    // ไม่มีข้อมูลบิลติดมา = เข้าหน้าตรงๆ ให้กู้จากร่าง
    // แก้บิลเดิมไม่มีร่างของตัวเอง ห้ามหยิบร่างบิลใหม่มาใส่
    const navState =
      location.state?.repairData || location.state?.repairItems
        ? location.state
        : null;
    const restored =
      navState ||
      (!isEditing && !draftRestoredRef.current && loadDraft(DRAFT_SUSPENSION));
    draftRestoredRef.current = true;
    if (restored && !navState) toast.info("กู้คืนข้อมูลที่กรอกค้างไว้แล้ว");
    if (!restored) return;

    const {
      repairData,
      repairItems: savedItems,
      editRepairId,
      hideMoreFields,
      scrollToItems,
    } = restored;

    if (scrollToItems) {
      scrollToNewRow(() => {
        const headers = document.querySelectorAll("[data-repair-items-top]");
        return [...headers].find((el) => el.offsetParent !== null);
      }, "start");
    }

    if (repairData) {
      Object.keys(repairData).forEach((key) => {
        setValue(key, repairData[key]);
      });
    }

    if (savedItems && Array.isArray(savedItems)) {
      const isTabItem = isSuspensionTabItem;
      const tabItems = savedItems.filter(isTabItem);
      const firstTabIndex = savedItems.findIndex(isTabItem);
      setTabBlockIndex(
        firstTabIndex === -1
          ? 0
          : collapseSidePairs(savedItems.slice(0, firstTabIndex)).length,
      );
      const manualItems = collapseSidePairs(
        savedItems.filter((i) => !isTabItem(i)),
      );
      restoreTabs(tabItems);

      // แก้บิลที่บันทึกแล้ว ของถูกหักไปแล้ว ต้องบวกคืนตอนคิดว่าเบิกได้เท่าไหร่
      const map = {};
      // ใบประเมินราคายังไม่เคยเบิกของออกจากคลัง จึงไม่มีอะไรให้บวกคืน
      if (editRepairId && !restored.stockNotDeducted) {
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
        manualItems.map(withRowId).map((it) => {
          if (it.availableStock !== undefined) return it;
          const key =
            it.id != null
              ? `id:${it.id}`
              : `${it.partNumber}|${it.brand}|${it.name || ""}`;
          return {
            ...it,
            availableStock: (it.stockQuantity || 0) + (map[key] || 0),
          };
        }),
      );
      // ย้อนกลับมาหรือแก้บิลเดิม รายการตั้งต้นถูกตัดสินไปแล้ว ไม่ต้องเติมซ้ำ
      restoredRef.current = !restored.addSuspensionDefaults;
      pendingHandoffRef.current = !!restored.addSuspensionDefaults;
    }

    if (hideMoreFields) {
      setIsMoreFieldsVisible(false);
    } else {
      const hasHiddenValue = Array.from(
        document.querySelectorAll('form input[type="hidden"]'),
      ).some((el) => String(el.value ?? "").trim() !== "");
      if (hasHiddenValue) setIsMoreFieldsVisible(true);
    }

    const preserved = {
      ...(editRepairId
        ? {
            editRepairId,
            stockNotDeducted: restored.stockNotDeducted,
            backIdx: restored.backIdx,
          }
        : {}),
      ...(!editRepairId && restored.backIdx != null
        ? { backIdx: restored.backIdx }
        : {}),
      ...(location.state?.from ? { from: location.state.from } : {}),
      ...(location.state?.origin ? { origin: location.state.origin } : {}),
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
    // withRowId สร้างใหม่ทุกเรนเดอร์ ใส่ไว้จะกู้ซ้ำไม่หยุด
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, setValue, isEditing]);

  const fetchCompatibleParts = async (brand, model) => {
    try {
      const res = await listParts();
      const allParts = res.data;

      // อะไหล่หมวดอื่นที่ระบุรุ่นรถไว้ (เช่นน้ำมัน) ไม่ต้องโผล่ในแท็บ
      const compatible = allParts.filter((part) => {
        if (part.category?.name !== SUSPENSION_CATEGORY) return false;
        if (!part.compatibleVehicles) return false;

        return part.compatibleVehicles.some(
          (vehicle) => vehicle.brand === brand && vehicle.model === model,
        );
      });

      setCompatibleParts(compatible.sort(byPartName));
    } catch (error) {
      toastError(error);
      setCompatibleParts([]);
    } finally {
      setIsPartsLoaded(true);
    }
  };

  // ทะเบียนเก็บเป็น "ตัวอักษร เว้นวรรค ตัวเลข"
  const plateText =
    watch("plateLetters") && watch("plateNumbers")
      ? `${watch("plateLetters")} ${watch("plateNumbers")}`
      : "";

  const handlePriceClick = (index, item) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setEditingItem({ source: "manual", index, ...item });
    setPriceDialogOpen(true);
  };

  const handlePriceConfirm = (payload) => {
    if (!editingItem) return;
    if (editingItem.source === "manual") {
      updateItemPrice(editingItem.index, payload);
      return;
    }
    const newPrice = typeof payload === "number" ? payload : payload?.price;
    if (
      editingItem.source === "compatible" &&
      editingItem.partId &&
      newPrice != null
    ) {
      setPriceOverride(editingItem.partId, newPrice);
    }
  };

  const handleEditCompatiblePrice = (part) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setEditingItem({
      source: "compatible",
      partId: part.id,
      sellingPrice: getPriceForPart(part),
      basePrice: part.sellingPrice,
      name: part.name,
      partNumber: part.partNumber,
      description: part.description,
      brand: part.brand,
      secureUrl: part.secureUrl,
      category: part.category,
      attributes: part.attributes,
    });
    setPriceDialogOpen(true);
  };

  const onInvalid = (errs) =>
    focusFirstInvalid(errs, () => setIsCustomerInfoOpen(true));

  const buildAllRepairItems = () => [
    ...repairItems.slice(0, tabBlockIndex),
    ...buildTabItems(),
    ...repairItems.slice(tabBlockIndex),
  ];

  const watchedValues = watch();
  const draftItems = buildAllRepairItems();
  const draftKey = JSON.stringify({ watchedValues, draftItems });

  useEffect(() => {
    if (isEditing || !draftRestoredRef.current) return;

    // ของที่ติ๊กไว้คลี่กลับไม่ได้จนกว่ารายการอะไหล่จะโหลดเสร็จ เขียนร่างตอนนี้ของจะหาย
    if (watchedValues.brand && watchedValues.model && !isPartsLoaded) return;

    const timer = setTimeout(() => {
      const draft = { repairData: watchedValues, repairItems: draftItems };
      if (isDraftWorthSaving(draft)) saveDraft(DRAFT_SUSPENSION, draft);
      else clearDraft(DRAFT_SUSPENSION);
    }, 400);

    return () => clearTimeout(timer);
    // ใส่ค่าเหล่านี้ตรงๆ ตัวจับเวลาจะถูกตั้งใหม่ทุกเรนเดอร์ draftKey แทนอยู่แล้ว
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, isEditing, isPartsLoaded]);

  const handleClearForm = () => {
    reset(EMPTY_FORM);
    setClearCount((count) => count + 1);
    setRepairItems([]);
    clearTabs();
    setTabBlockIndex(0);
    setRestoredStockMap({});
    setActiveTab("left");
    setIsCustomerInfoOpen(false);
    clearDraft(DRAFT_SUSPENSION);
    setIsClearConfirmOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasAnythingToClear =
    draftItems.length > 0 ||
    isDraftWorthSaving({ repairData: watchedValues, repairItems: draftItems });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, SUBMIT_FEEDBACK_MS));

      // ฐานข้อมูลเก็บเป็นรายข้าง
      const allRepairItems = expandBothSides(buildAllRepairItems());

      navigate("/repairs/review", {
        state: {
          repairData: { ...data, type: "SUSPENSION" },
          repairItems: allRepairItems,
          from: "suspension",
          editRepairId: location.state?.editRepairId,
          backIdx:
            location.state?.backIdx ?? window.history.state?.usr?.backIdx,
          stockNotDeducted: location.state?.stockNotDeducted,
          origin: location.state?.from,
          statusSlug: location.state?.statusSlug,
          vehicleId: location.state?.vehicleId,
          returnTo: location.state?.returnTo,
          currentDate: location.state?.currentDate,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasVehicleSelected = Boolean(watch("brand") && watch("model"));
  const hasNoCompatibleParts =
    hasVehicleSelected && compatibleParts.length === 0;

  // หน้างานซ่อมไม่มีแท็บซ้าย/ขวา/อื่นๆ จึงย้ายได้เฉพาะตอนไม่ได้เลือกอะไหล่ในแท็บ
  const [isSwitchingToGeneral, setIsSwitchingToGeneral] = useState(false);

  const handleSwitchButton = async () => {
    setIsSwitchingToGeneral(true);
    await new Promise((resolve) => setTimeout(resolve, SUBMIT_FEEDBACK_MS));
    setIsSwitchingToGeneral(false);

    if (hasTabSelection) {
      toast.error("ยกเลิกอะไหล่ช่วงล่างที่เลือกไว้ก่อน");
      return;
    }
    handleSwitchToGeneralRepair();
  };

  const handleSwitchToGeneralRepair = () => {
    clearDraft(DRAFT_SUSPENSION);

    // ค่าแรงราคา 0 กับตั้งศูนย์ที่ระบบเติมให้บิลช่วงล่าง ไม่ต้องยกไป
    // ตั้งศูนย์ที่แถมกับยางยังต้องอยู่
    const [laborName, alignmentName] = SUSPENSION_DEFAULT_SERVICE_NAMES;
    const carriedItems = repairItems.filter(
      (item) =>
        item.partNumber ||
        !(
          (item.name === laborName && Number(item.sellingPrice) === 0) ||
          (item.name === alignmentName && !item.isFreebie)
        ),
    );

    navigate("/repairs/new", {
      state: {
        repairData: getValues(),
        repairItems: carriedItems,
        scrollToItems: true,
        // ไม่ส่งต่อ หน้างานซ่อมจะนึกว่าเป็นบิลใหม่ แล้วบันทึกเป็นบิลซ้ำ
        editRepairId: location.state?.editRepairId,
        stockNotDeducted: location.state?.stockNotDeducted,
        backIdx: location.state?.backIdx ?? window.history.state?.usr?.backIdx,
        origin: location.state?.from,
        statusSlug: location.state?.statusSlug,
        vehicleId: location.state?.vehicleId,
        returnTo: location.state?.returnTo,
        currentDate: location.state?.currentDate,
      },
    });
  };

  const goToTab = (next) => {
    if (next === activeTab) return;
    setSlideFrom(
      SUSPENSION_TABS.indexOf(next) > SUSPENSION_TABS.indexOf(activeTab)
        ? "right"
        : "left",
    );
    setActiveTab(next);
  };

  const extrasTotal = repairItems.reduce(
    (total, item) => total + item.sellingPrice * item.quantity,
    0,
  );

  const summaryBox = (
    <BillTotal
      count={countSelectedInTabs() + repairItems.length}
      total={tabTotal + extrasTotal}
      className="mt-4 mb-4"
    />
  );

  // จอใหญ่อยู่นอกฟอร์ม ปุ่มถัดไปจึงผูกกับฟอร์มด้วยชื่อ
  const renderItemsSection = (isDesktop) => (
    <>
      <div data-repair-items-top className="flex items-center gap-2 px-5 pt-4">
        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
          <ClipboardList className="text-primary h-6 w-6" />
        </div>
        <p className="text-[22px] font-semibold md:text-2xl">
          รายการซ่อมช่วงล่าง
        </p>
      </div>
      {compatibleParts.length > 0 && (
        <SuspensionTabs activeTab={activeTab} onChange={goToTab} />
      )}
      {/* ใช้ clip ไม่ใช่ hidden เพราะ hidden ทำให้แกนตั้งเป็น auto แล้วตัดเงาการ์ด */}
      <div className="overflow-x-clip">
        <SuspensionPartPanel
          key={`panel-${activeTab}-${slideFrom}`}
          side={activeTab}
          slideFrom={slideFrom}
          tabs={tabs}
          perSideService={perSideService}
          emptyMessage={
            !hasVehicleSelected
              ? "กรุณาเลือกยี่ห้อและรุ่นรถ"
              : compatibleParts.length === 0
                ? "ไม่มีอะไหล่ช่วงล่างของรถรุ่นนี้"
                : "ไม่พบอะไหล่ในตำแหน่งนี้"
          }
          onSwitchToGeneral={
            hasNoCompatibleParts ? handleSwitchToGeneralRepair : null
          }
          onPreview={setPreviewPart}
          onEditPrice={handleEditCompatiblePrice}
        />
      </div>
      {hasVehicleSelected &&
        (!hasNoCompatibleParts || repairItems.length > 0) && (
          <div className="flex items-center justify-between gap-2 px-5 pt-4">
            <div className="flex min-w-0 items-center gap-2">
              <p className="text-lg font-semibold sm:text-xl md:text-[22px]">
                รายการซ่อมเพิ่มเติม
              </p>
              <FreebieButton bill={bill} />
              <ReorderButton bill={bill} label="จัดเรียงรายการซ่อมเพิ่มเติม" />
            </div>
            <AddRepairItemDialog
              onAddItem={handleAddItemToRepair}
              selectedItems={[...repairItems, ...getSelectedTabItems()]}
              restoredStockMap={restoredStockMap}
              vehicle={{ brand: watch("brand"), model: watch("model") }}
            >
              <p className="text-primary cursor-pointer text-lg font-semibold whitespace-nowrap sm:text-xl md:text-[22px]">
                + เพิ่มรายการซ่อม
              </p>
            </AddRepairItemDialog>
          </div>
        )}
      {repairItems.length === 0 && compatibleParts.length === 0 ? (
        <div className={isDesktop ? "" : "h-24 lg:h-0"} />
      ) : (
        <div
          className={
            repairItems.length > 0 && !isDesktop ? "pb-24 xl:pb-0" : ""
          }
        >
          <BillItemRows
            bill={bill}
            onRowClick={handlePriceClick}
            transitionPrefix="suspension-item"
          />
          {compatibleParts.length > 0 && (
            <>
              {summaryBox}
              <div
                className={`flex justify-center ${
                  isDesktop || repairItems.length > 0 ? "pb-4" : "pb-28"
                }`}
              >
                <FormButton
                  label="ถัดไป"
                  isLoading={isLoading}
                  {...(isDesktop ? { form: "suspension-form" } : {})}
                  disabled={countSelectedInTabs() + repairItems.length === 0}
                />
              </div>
            </>
          )}
        </div>
      )}
    </>
  );

  return (
    <div>
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
                  <CarRepair color="#ffffff" className="h-6 w-6 xl:hidden" />
                  <CarRepair
                    color="#1976d2"
                    className="hidden h-6 w-6 xl:block"
                  />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-surface xl:text-primary truncate text-2xl font-semibold md:text-[26px]">
                  {isEditing
                    ? location.state?.stockNotDeducted
                      ? "แก้ไขใบประเมินราคา"
                      : "แก้ไขงานซ่อม"
                    : "เช็กช่วงล่าง"}
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
            id="suspension-form"
            className="xl:[&_label]:text-normal xl:[&_.text-surface]:text-normal flex flex-1 flex-col"
            onSubmit={handleSubmit(onSubmit, onInvalid)}
          >
            <CustomerInfoSection
              register={register}
              errors={errors}
              watch={watch}
              isOpen={isCustomerInfoOpen}
              onToggle={() => setIsCustomerInfoOpen(!isCustomerInfoOpen)}
              setValue={setValue}
            />

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

            <FormInput
              register={register}
              name="description"
              label="รายละเอียดการซ่อม"
              type="text"
              placeholder="เช่น ค้างตั้งศูนย์ ลูกค้าจะมาวันเสาร์"
              color="surface"
              errors={errors}
            />

            <div className="mt-4 flex justify-center px-5">
              <button
                type="button"
                onClick={handleSwitchButton}
                disabled={isSwitchingToGeneral}
                className="border-surface text-surface xl:border-primary xl:text-primary flex h-[41px] cursor-pointer items-center justify-center rounded-[20px] border px-5 text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-70 md:text-xl"
              >
                {isSwitchingToGeneral && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                เปลี่ยนเป็นงานซ่อมทั่วไป
              </button>
            </div>

            <div className="hidden pb-6 xl:block" />

            <div className="bg-surface shadow-primary mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl xl:hidden">
              {renderItemsSection(false)}
            </div>
          </form>
        </div>
        <div className="hidden w-1/2 xl:block">
          <div className="bg-surface shadow-primary h-fit rounded-2xl">
            {renderItemsSection(true)}
          </div>
        </div>
      </div>
      <PartPreviewDialog
        part={previewPart}
        price={previewPart ? getPriceForPart(previewPart) : undefined}
        open={!!previewPart}
        onOpenChange={(open) => !open && setPreviewPart(null)}
      />

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

export default SuspensionInspection;
