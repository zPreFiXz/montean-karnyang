import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X, ClipboardList, LoaderCircle, ChevronLeft } from "lucide-react";
import FormInput from "@/components/forms/FormInput";
import AddRepairItemDialog from "@/components/dialogs/AddRepairItemDialog";
import EditPriceDialog from "@/components/dialogs/EditRepairItemDialog";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { scrollToNewRow } from "@/utils/scrollToNewRow";
import BillTotal from "@/components/cards/BillTotal";
import CustomerInfoSection from "@/components/bill/CustomerInfoSection";
import VehicleFields from "@/components/bill/VehicleFields";
import FormButton from "@/components/forms/FormButton";
import { listParts } from "@/api/part";
import { repairSchema } from "@/utils/schemas";
import { SUSPENSION_CATEGORY } from "@/constants/categories";
import { isPartLikeItem, isDiscountItem } from "@/constants/services";
import { collapseSidePairs, countDisplayedItems } from "@/utils/repairItemGroups";
import useBillNavigation from "@/hooks/useBillNavigation";
import useVehicleModels from "@/hooks/useVehicleModels";
import { focusFirstInvalid } from "@/utils/focusInvalidField";
import { EMPTY_FORM, SUBMIT_FEEDBACK_MS } from "@/constants/billForm";
import useBillItems, { getProductName } from "@/hooks/useBillItems";
import { DRAFT_REPAIR, loadDraft, saveDraft, clearDraft, isDraftWorthSaving } from "@/utils/repairDraft";
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
  // เตรียมโค้ดของหน้าที่มักไปต่อจากหน้านี้ กดแล้วจะได้ไม่ต้องรอโหลด
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
  // นับรอบที่กดล้างฟอร์ม ใช้เป็น key ให้ช่องเบอร์รถเริ่มใหม่แบบยุบ
  const [clearCount, setClearCount] = useState(0);
  const [isCustomerInfoOpen, setIsCustomerInfoOpen] = useState(false);
  // งานซ่อม = ผูกกับรถ, ขายอะไหล่ = ลูกค้าซื้อของกลับไปเอง ไม่ได้เอารถมา
  // GENERAL = งานซ่อมผูกกับรถ, SERVICE = งานบริการที่ไม่ต้องเก็บประวัติรถ, SALE = ขายอะไหล่หน้าร้าน
  // เกณฑ์ของ SERVICE คือ "ไม่ต้องเก็บประวัติรถ" ไม่ใช่ "ทำที่ไหน" — ปะยางมอเตอร์ไซค์ที่ร้านก็เข้าข่าย
  // เป็นแค่โหมดของหน้าจอ ตอนบันทึกยังเป็นบิลประเภท GENERAL แต่ส่ง noVehicle ไปด้วย
  const [billType, setBillType] = useState("GENERAL");
  const isSale = billType === "SALE";
  const isService = billType === "SERVICE";
  const hasNoVehicle = isSale || isService;
  const {
    repairItems,
    setRepairItems,
    withRowId,
    handleAddItemToRepair,
    reorderButton,
    freebieButton,
    renderItemRows,
    renderItemDialogs,
    updateItemPrice,
  } = useBillItems();
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

  // รุ่นรถที่มีอะไหล่ระบุว่าใช้ได้ ใช้ตัดสินว่ากดเช็กช่วงล่างต่อได้ไหม
  // null = ยังโหลดไม่เสร็จ ระหว่างนั้นไม่ปิดปุ่ม ดีกว่าห้ามกดทั้งที่อาจกดได้
  const [modelsWithParts, setModelsWithParts] = useState(null);
  const [isCheckingSuspension, setIsCheckingSuspension] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchModelsWithParts();
  }, []);

  useEffect(() => {
    // ไม่มี state แปลว่าเข้าหน้านี้ตรงๆ — ถ้ามีร่างค้างไว้ให้กู้กลับมา
    // (ออกไปเพิ่มสต็อกกลางคัน กดย้อนกลับพลาด หรือเครื่องรีเฟรชหน้าเอง)
    // ใช้ state เฉพาะตอนที่มีข้อมูลบิลติดมาจริง ไม่งั้นถือเป็นการเข้าหน้าตรงๆ แล้วกู้จากร่าง
    // (ย้อนกลับมาจากหน้าอื่นจะเหลือแค่ทางกลับที่ตัดเก็บไว้ ถ้าถือเป็น state จะไม่ได้ของที่กรอกคืน
    //  ปุ่มตะกร้าก็มาแบบไม่มีข้อมูลบิล ต้องกู้ร่างก่อนแล้วค่อยเพิ่มของต่อท้าย ดู cartItemHandledRef)
    // แก้บิลเดิมไม่มีร่างของตัวเอง ห้ามไปหยิบร่างบิลใหม่มาใส่
    const navState =
      location.state?.repairData || location.state?.repairItems
        ? location.state
        : null;
    const restored =
      navState ||
      (!isEditing && !draftRestoredRef.current && loadDraft(DRAFT_REPAIR));
    draftRestoredRef.current = true;
    // บอกให้รู้ว่าของที่เห็นมาจากไหน ไม่งั้นเปิดหน้าบิลใหม่แล้วเจอข้อมูลกรอกไว้จะงงว่าซ้ำกับอะไร
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
        // เฉพาะบิลที่บันทึกแล้ว (แก้ไขบิลเดิม) — ของถูกหักจากคลังไปแล้ว ต้องบวกคืนตอนคำนวณว่าเบิกได้เท่าไหร่
        // ถ้าแค่ย้อนกลับมาจากหน้ายืนยัน คลังยังไม่ถูกหัก ถ้าบวกคืนจะกลายเป็นมีของมากกว่าความจริง
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
          // ซ้ายกับขวาที่มาจากบิลที่บันทึกแล้ว (หรือจากหน้าเช็กช่วงล่าง) รวมกลับเป็นบรรทัดทั้งสองข้าง
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

      // มาจากปุ่มแก้ไขรายการซ่อม -> พาไปที่หัวข้อของส่วนนั้น ไม่ใช่ล่างสุดของหน้า
      // เพราะปุ่ม "+ เพิ่มรายการซ่อม" อยู่ที่หัวข้อ ถ้ามีหลายรายการจะต้องเลื่อนกลับขึ้นมาเอง
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
        // เก็บเฉพาะข้อมูลที่ยังต้องใช้ แต่ต้องคงฟิลด์ของตัวจัดการเส้นทางไว้ด้วย
        // (ลำดับหน้าในประวัติอยู่ในนั้น ถ้าเขียนทับทิ้งจะคำนวณทางกลับหลังบันทึกไม่ได้)
        window.history.replaceState(
          { ...window.history.state, usr: preserved },
          document.title,
          window.location.pathname,
        );
      }
    }
    // กู้ข้อมูลครั้งเดียวตาม state ที่ส่งมา withRowId สร้างใหม่ทุกเรนเดอร์ ใส่ไว้จะกู้ซ้ำไม่หยุด
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, setValue, isEditing]);

  useEffect(() => {
    setValue("type", isSale ? "SALE" : "GENERAL");
    setValue("noVehicle", hasNoVehicle);
  }, [billType, isSale, hasNoVehicle, setValue]);

  // เก็บร่างไว้ระหว่างพิมพ์ จะได้ออกจากหน้าไปเพิ่มสต็อกแล้วกลับมากรอกต่อได้
  // หน่วงไว้ก่อนเขียนเพื่อไม่ให้เขียนลงเครื่องทุกตัวอักษรที่พิมพ์
  const watchedValues = watch();
  const draftKey = JSON.stringify({ watchedValues, repairItems });

  useEffect(() => {
    if (isEditing || !draftRestoredRef.current) return;

    const timer = setTimeout(() => {
      const draft = { repairData: watchedValues, repairItems };
      if (isDraftWorthSaving(draft)) saveDraft(DRAFT_REPAIR, draft);
      // ลบทุกช่องทิ้งเอง = ตั้งใจเริ่มใหม่ ร่างเดิมไม่ควรกลับมาอีก
      else clearDraft(DRAFT_REPAIR);
    }, 400);

    return () => clearTimeout(timer);
    // draftKey คือค่าที่แปลงเป็นข้อความแล้วของทั้งสองตัว ใส่ซ้ำจะกลายเป็นเทียบ
    // ที่อยู่อ้างอิงซึ่งเปลี่ยนทุกรอบเรนเดอร์ ตัวจับเวลาจะถูกตั้งใหม่ไม่หยุด
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, isEditing]);

  // หน้าเช็กช่วงล่างเลือกอะไหล่จากรายการที่ผูกกับรุ่นรถไว้ ใช้เกณฑ์เดียวกันตรงนี้
  const fetchModelsWithParts = async () => {
    try {
      const res = await listParts();
      const keys = new Set();
      (res.data || []).forEach((part) => {
        // นับเฉพาะอะไหล่ช่วงล่าง ให้ตรงกับที่หน้าเช็กช่วงล่างเอาไปแสดง
        if (part.category?.name !== SUSPENSION_CATEGORY) return;
        (part.compatibleVehicles || []).forEach((vehicle) => {
          keys.add(`${vehicle.brand}|${vehicle.model}`);
        });
      });
      setModelsWithParts(keys);
    } catch {
      // ถามไม่ได้ก็ปล่อยให้กดต่อได้ หน้าเช็กช่วงล่างมีทางออกให้อยู่แล้ว
      setModelsWithParts(null);
    }
  };

  // ยังไม่ได้เลือกรถก็กดได้ ไปเลือกที่หน้าโน้นแทน
  const hasSuspensionParts =
    !modelsWithParts ||
    !watch("brand") ||
    !watch("model") ||
    modelsWithParts.has(`${watch("brand")}|${watch("model")}`);

  // เลือกลูกค้าที่เคยบันทึกไว้ — เติมทั้งสามช่องให้ตรงกับที่เก็บไว้ แก้ทับได้ตามปกติ
  // ทะเบียนเก็บเป็น "ตัวอักษร เว้นวรรค ตัวเลข" ให้ตรงกับที่บันทึกไว้ตอนสร้างบิล
  const plateText =
    watch("plateLetters") && watch("plateNumbers")
      ? `${watch("plateLetters")} ${watch("plateNumbers")}`
      : "";

  // ลูกค้าขอเช็กช่วงล่างเพิ่มระหว่างที่เปิดบิลเปลี่ยนยางค้างไว้ — ยกทั้งข้อมูลรถและรายการที่เลือกไปด้วย
  // จะได้อยู่ในบิลเดียวกัน ไม่ต้องเปิดบิลใหม่แล้วเก็บเงินสองรอบ (ขากลับมีอยู่แล้วที่หน้าเช็กช่วงล่าง)
  const handleAddSuspensionCheck = async () => {
    // หน่วงสั้นๆ ให้เห็นตัวหมุนก่อน ไม่งั้นกดแล้วเงียบจนไม่รู้ว่ากดติด
    setIsCheckingSuspension(true);
    await new Promise((resolve) => setTimeout(resolve, SUBMIT_FEEDBACK_MS));
    setIsCheckingSuspension(false);

    // หน้าเช็กช่วงล่างเลือกอะไหล่ตามรุ่นรถ ยังไม่รู้รุ่นก็ไม่มีอะไหล่ให้เลือก
    // ใช้ตัวตรวจชุดเดียวกับปุ่มถัดไป ช่องที่ขาดขึ้นกรอบแดงพร้อมข้อความ แล้วเลื่อนไปหาช่องแรกที่ขาด
    if (!watch("brand") || !watch("model")) {
      await trigger(["brand", "model"]);
      onInvalid(watch("brand") ? { model: true } : { brand: true });
      return;
    }

    // ไปหน้าโน้นก็เลือกอะไหล่ไม่ได้ บอกเหตุผลแล้วอยู่หน้านี้ต่อ
    if (!hasSuspensionParts) {
      toast.error("ไม่มีอะไหล่ช่วงล่างของรถรุ่นนี้");
      return;
    }

    // บิลย้ายไปอยู่ในมือหน้าเช็กช่วงล่างแล้ว ร่างของหน้านี้จึงหมดหน้าที่
    // ปล่อยไว้จะกลายเป็นร่างเก่าที่ไม่มีอะไหล่ช่วงล่างคอยดักอยู่
    clearDraft(DRAFT_REPAIR);

    navigate("/inspections/suspension", {
      state: {
        repairData: getValues(),
        repairItems,
        // เลื่อนลงไปที่ส่วนเลือกอะไหล่เลย เพราะข้อมูลรถกับลูกค้ายกมาแล้ว
        // ยกเว้นยังไม่ได้เลือกรถ ซึ่งต้องกรอกด้านบนก่อน ไม่งั้นจะเลื่อนพ้นช่องที่ต้องกรอก
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

  // ล้างทุกอย่างเริ่มใหม่ เช่นลูกค้าเปลี่ยนใจ หรือกรอกผิดคันจนแก้ทีละช่องช้ากว่า
  const handleClearForm = () => {
    reset(EMPTY_FORM);
    // ช่องเบอร์รถที่กางไว้ยุบกลับเป็นปุ่มเล็กเหมือนฟอร์มใหม่
    setClearCount((count) => count + 1);
    setRepairItems([]);
    setRestoredStockMap({});
    // ไม่แตะโหมดบิล เพราะมันคือฟอร์มที่กำลังใช้อยู่ ไม่ใช่ข้อมูลที่กรอก
    // คนกดล้างระหว่างเปิดบิลขายอะไหล่มักจะขายใบใหม่ต่อ ไม่ได้จะเปลี่ยนไปทำงานซ่อม
    // สำเนาข้อมูลรถที่เก็บไว้ตอนสลับโหมดต้องทิ้งด้วย
    // ไม่งั้นล้างแล้วสลับไปขายอะไหล่และกลับมา รถคันเดิมจะโผล่กลับมาเอง
    vehicleFieldsRef.current = {};
    setIsCustomerInfoOpen(false);
    clearDraft(DRAFT_REPAIR);
    setIsClearConfirmOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChangeBillType = (nextType) => {
    const leavingVehicleMode = nextType === "SALE" || nextType === "SERVICE";

    setBillType(nextType);

    // ล้างข้อมูลรถทิ้งเมื่อสลับไปโหมดที่ไม่ผูกรถ ไม่งั้นค่าที่กรอกค้างไว้จะถูกส่งไปสร้างรถผีในระบบ
    // แต่เก็บสำเนาไว้ก่อน กดสลับไปดูโหมดอื่นแล้วกลับมาจะได้ไม่ต้องกรอกรถใหม่ทั้งชุด
    if (leavingVehicleMode) {
      // เก็บสำเนาเฉพาะตอนออกจากโหมดงานซ่อมเท่านั้น
      // สลับไปมาระหว่างงานบริการกับขายอะไหล่จะได้ไม่เอาช่องเปล่าไปทับสำเนาที่เก็บไว้
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
      // หน่วงสั้นๆ ให้เห็นตัวหมุนก่อนหน้าจอเปลี่ยน ไม่งั้นกดแล้วหน้าเปลี่ยนทันที
      // จนไม่มีอะไรยืนยันว่ากดติด (ไม่ได้รอเซิร์ฟเวอร์ ข้อมูลส่งต่อผ่าน state ล้วน)
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
          // ใบประเมินราคายังไม่เคยเบิกของ ต้องติดไปกลับพร้อมกับหน้าสรุป
          // ไม่งั้นย้อนกลับมาแก้แล้วจะบวกของในบิลคืนเข้าสต็อกที่เบิกได้ ทั้งที่ยังไม่เคยหักออก
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

  // ปุ่มตะกร้าในรายละเอียดอะไหล่/บริการส่งของมาทาง state ทำครั้งเดียว แล้วล้าง state ทิ้ง
  // ไม่งั้นรีเฟรชหรือย้อนกลับมาจะได้ของซ้ำอีกชิ้น (ร่างเก็บชิ้นแรกไว้แล้ว)
  // ผ่านทางเดียวกับไดอะล็อกเพิ่มรายการ ของที่ต้องเลือกข้างหรือเลือกงานน้ำมันจึงยังถามก่อน
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
    // handleAddItemToRepair สร้างใหม่ทุกเรนเดอร์ ทำงานครั้งเดียวตาม state ที่ส่งมาก็พอ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const handlePriceClick = (index, item) => {
    setEditingItem({ index, ...item });
    setPriceDialogOpen(true);
  };

  const handlePriceConfirm = (payload) => {
    if (editingItem) updateItemPrice(editingItem.index, payload);
  };

  // หัวข้อรายการซ่อมกับกล่องยอดรวม ใช้ทั้งฝั่งมือถือและจอใหญ่
  const itemsHeader = (
    <div
      data-repair-items-top
      className="flex items-center justify-between px-[20px] pt-[16px]"
    >
      <div className="flex items-center gap-[8px]">
        <div className="bg-primary/10 flex h-[32px] w-[32px] items-center justify-center rounded-full">
          <ClipboardList className="text-primary h-5 w-5" />
        </div>
        <p className="text-[22px] font-semibold md:text-2xl">รายการซ่อม</p>
        {reorderButton}
        {freebieButton}
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
    <div className="bg-gradient-primary shadow-primary flex min-h-[100svh] flex-col xl:min-h-[calc(100vh-73px)] xl:flex-row xl:items-start xl:gap-[16px] xl:bg-transparent xl:px-[16px] xl:pt-[24px] xl:pb-[24px] xl:shadow-none">
      <div className="xl:shadow-primary flex flex-1 flex-col xl:h-fit xl:w-1/2 xl:flex-initial xl:rounded-2xl xl:bg-white">
        <div className="flex items-center justify-between gap-[8px] px-[20px] pt-[16px]">
          <div className="flex min-w-0 items-center gap-[8px]">
            {isEditing || canReturnToVehicle ? (
              <button
                type="button"
                onClick={isEditing ? handleCancelEdit : handleBackToVehicle}
                aria-label={
                  isEditing
                    ? "กลับไปหน้ารายละเอียดงานซ่อม"
                    : "กลับไปหน้าประวัติรถ"
                }
                className="bg-surface/20 xl:bg-primary/10 flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
              >
                <ChevronLeft className="text-surface xl:hidden" />
                <ChevronLeft className="text-primary hidden xl:block" />
              </button>
            ) : (
              <div className="bg-surface/20 xl:bg-primary/10 flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full">
                <Plus color="#ffffff" className="xl:hidden" />
                <Plus className="text-primary hidden xl:block" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-surface xl:text-primary truncate text-2xl font-semibold md:text-[26px]">
                {/* ตอนแก้บิลเดิมเรียกตามชนิดบิลแบบเดียวกับตอนเปิดบิลใหม่
                    ใบประเมินราคายังไม่ใช่งานซ่อม (ดูได้จาก stockNotDeducted ที่หน้ารายละเอียดส่งมา) */}
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
          {/* โผล่เฉพาะตอนมีอะไรให้ล้างจริง ไม่ใช่ปุ่มที่กดแล้วไม่เกิดอะไรค้างอยู่บนหัวเรื่อง */}
          {/* แก้บิลที่บันทึกแล้ว ไม่ให้ล้างทั้งบิลกลางทาง กลับไปหน้าบิลแทนถ้าไม่อยากแก้ */}
          {hasAnythingToClear && !isEditing && (
            <button
              type="button"
              onClick={() => setIsClearConfirmOpen(true)}
              className="text-destructive bg-surface flex shrink-0 cursor-pointer items-center gap-[4px] rounded-full px-[10px] py-[4px] text-lg font-medium duration-300 md:text-xl xl:bg-transparent xl:px-0"
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
          {/* ประเภทบิล */}
          <div className="mx-[20px] mt-[16px] flex gap-[8px]">
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
                className={`h-[45px] flex-1 cursor-pointer rounded-[10px] border-2 text-lg font-semibold duration-300 md:text-xl ${
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
          {/* ข้อมูลรถ — บิลขายอะไหล่หน้าร้านไม่มีรถมาเกี่ยว จึงซ่อนทั้งก้อน */}
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
            <div className="mt-[16px] flex justify-center px-[20px]">
              <button
                type="button"
                onClick={handleAddSuspensionCheck}
                disabled={isCheckingSuspension}
                className="border-surface text-surface xl:border-primary xl:text-primary flex h-[41px] cursor-pointer items-center justify-center rounded-[20px] border px-[20px] text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-70 md:text-xl"
              >
                {isCheckingSuspension && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                เช็กช่วงล่างต่อ
              </button>
            </div>
          )}

          <div className="hidden pb-[24px] xl:block" />

          {/* Mobile: รายการซ่อม */}
          <div className="bg-surface shadow-primary mt-[16px] flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl xl:hidden">
            {itemsHeader}
            {repairItems.length === 0 ? (
              // บิลขายไม่มีข้อมูลรถ หน้าจึงสั้นกว่า ต้องยืดตามพื้นที่ที่เหลือข้อความถึงจะอยู่กลาง
              // แต่ไม่เตี้ยกว่างานซ่อม ไม่งั้นกล่องจะหดตอนกางข้อมูลลูกค้าซึ่งเป็นคนละเรื่องกัน
              <div className={hasNoVehicle ? "flex flex-1 flex-col" : ""}>
                <div
                  className={`flex items-center justify-center ${
                    hasNoVehicle
                      ? "min-h-[228px] flex-1"
                      : "h-[228px] xl:h-auto"
                  }`}
                >
                  <p className="text-subtle-light text-xl md:text-[22px]">
                    กรุณาเพิ่มรายการซ่อม
                  </p>
                </div>
                <div className="pb-[92px]" />
              </div>
            ) : (
              <div className="pb-[20px]">
                {renderItemRows({
                  onRowClick: handlePriceClick,
                  transitionPrefix: "repair-item",
                })}
                {totalBox}
                <div className="flex justify-center pb-[92px]">
                  <FormButton label="ถัดไป" isLoading={isLoading} />
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Desktop: รายการซ่อม */}
      <div className="hidden w-1/2 xl:block">
        <div className="bg-surface shadow-primary h-fit rounded-2xl">
          {itemsHeader}
          {repairItems.length === 0 ? (
            <div>
              <div className="flex h-[228px] items-center justify-center">
                <p className="text-subtle-light text-xl md:text-[22px]">
                  กรุณาเพิ่มรายการซ่อม
                </p>
              </div>
            </div>
          ) : (
            <div>
              {renderItemRows({
                onRowClick: handlePriceClick,
                transitionPrefix: "repair-item",
              })}

              {totalBox}
              <div className="flex justify-center pb-[16px]">
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
      {renderItemDialogs()}
      <EditPriceDialog
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
        // ชื่อเต็มแบบที่เห็นบนการ์ด (ยี่ห้อ + ขนาดยาง + รุ่น) ไม่ใช่ชื่อในคลังเปล่าๆ
        // ไม่งั้นแก้แค่ตัวอักษรเดียว ยี่ห้อกับขนาดจะหายไปทั้งชุด เพราะชื่อที่พิมพ์เองคือทั้งบรรทัด
        currentName={editingItem ? getProductName(editingItem) : ""}
        // ทุกบรรทัดพิมพ์ชื่อทับได้ ตัวเชื่อมกับอะไหล่ยังอยู่ รูปกับรหัสจึงยังตามของจริง
        canEditName
        isPartLine={isPartLikeItem(editingItem)}
        isDiscountLine={isDiscountItem(editingItem)}
      />

      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleClearForm}
        title="ยืนยันการล้างข้อมูล"
        // ยังไม่ได้บันทึกลงระบบ กดผิดก็กรอกใหม่ได้ ไม่ต้องกดค้าง
        requireHold={false}
        itemName="ข้อมูลที่กรอกไว้ทั้งหมด"
        confirmLabel="ล้างข้อมูล"
      />
    </div>
  );
};

export default RepairCreate;
