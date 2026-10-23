import FormInput from "@/components/forms/FormInput";
import AddRepairItemDialog from "@/components/dialogs/AddRepairItemDialog";
import EditPriceDialog from "@/components/dialogs/EditRepairItemDialog";
import PartPreviewDialog from "@/components/dialogs/PartPreviewDialog";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { listVehicleModels } from "@/api/vehicleModel";
import { listParts } from "@/api/part";
import { listInventory } from "@/api/inventory";
import { formatCurrency } from "@/utils/formats";
import {
  Plus,
  Minus,
  Check,
  Wrench,
  SquarePen,
  ChevronDown,
  AlertTriangle,
  ContactRound,
  ClipboardList,
  X,
  LoaderCircle,
  ChevronLeft,
} from "lucide-react";
import BillTotal from "@/components/cards/BillTotal";
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
import { CarRepair, SparePart } from "@/components/icons/Icons";
import { toastError } from "@/utils/handleError";
import {
  isPartLikeItem,
  isDiscountItem,
  SUSPENSION_DEFAULT_SERVICE_NAMES,
  PER_SIDE_SERVICE_NAME,
} from "@/constants/services";
import { onKeyActivate } from "@/utils/a11y";
import {
  isPerSide,
  getPartType,
  SUSPENSION_PART_TYPE_ORDER,
} from "@/utils/suspension";
import useBillItems, {
  getProductName,
  renderProductInfo,
} from "@/hooks/useBillItems";
import { SUSPENSION_CATEGORY } from "@/constants/categories";
import {
  collapseSidePairs,
  expandBothSides,
  isSuspensionTabItem,
} from "@/utils/repairItemGroups";
import { scrollToNewRow } from "@/utils/scrollToNewRow";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { withOtherBrandLast } from "@/utils/vehicleBrand";
import { usePrefetchPages } from "@/routes/pageImports";

const CUSTOMER_FIELDS = ["name", "address", "phoneNumber", "taxId"];

// ตัวเรียงภาษาไทย ก-ฮ และเลขเรียงตามค่า ไม่ใช่ตามตัวอักษร (2 มาก่อน 10)
const thaiCollator = new Intl.Collator("th", { numeric: true });
const byPartName = (a, b) => thaiCollator.compare(a?.name || "", b?.name || "");

const TAB_ORDER = ["left", "right", "other"];

// สามชนิดที่ช่างไล่ตรวจประจำในแท็บ "อื่นๆ" ให้ขึ้นก่อนตามลำดับนี้
// ชนิดอื่นยังขึ้นเหมือนกัน แค่ไปต่อท้ายเรียงตามตัวอักษร
const OTHER_TAB_ORDER = ["คันส่งกลาง", "โช้คหน้า", "โช้คหลัง"];

// หน่วงสั้นๆ ให้เห็นตัวหมุนก่อนหน้าจอเปลี่ยน (ไม่ได้รอเซิร์ฟเวอร์ ข้อมูลส่งต่อผ่าน state ล้วน)
// ข้างของรายการซ่อมเพิ่มเติมที่เลือกมาจากหน้างานซ่อม
const SUBMIT_FEEDBACK_MS = 400;

// ล้างฟอร์มต้องไล่ชื่อช่องให้ครบ — reset({}) เปล่าๆ ไม่ได้เขียนค่าว่างลงช่องที่ไม่ได้คุมด้วย React
// (ทะเบียน เลขกิโลเมตร รายละเอียด) ข้อความเดิมจึงค้างอยู่บนหน้าจอ
const EMPTY_FORM = {
  name: "",
  address: "",
  phoneNumber: "",
  taxId: "",
  brand: "",
  model: "",
  plateLetters: "",
  plateNumbers: "",
  province: "",
  fleetNo: "",
  mileage: "",
  description: "",
};
const TAB_LABELS = { left: "ซ้าย", right: "ขวา", other: "อื่นๆ" };
const SuspensionInspection = () => {
  // เตรียมโค้ดของหน้าที่มักไปต่อจากหน้านี้ กดแล้วจะได้ไม่ต้องรอโหลด
  usePrefetchPages(["RepairReview"]);

  const navigate = useNavigate();
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
  // นับรอบที่กดล้างฟอร์ม ใช้เป็น key ให้ช่องเบอร์รถเริ่มใหม่แบบยุบ
  const [clearCount, setClearCount] = useState(0);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const {
    repairItems,
    setRepairItems,
    withRowId,
    handleAddItemToRepair,
    reorderButton,
    freebieButton,
    renderItemRows,
    itemDialogs,
  } = useBillItems({
    // ของชิ้นเดียวกันที่ติ๊กในแท็บใช้สต็อกกองเดียวกับรายการซ่อมเพิ่มเติม
    getReservedCount: (item) => getTabSelectedCountForItem(item),
    reorderLabel: "จัดเรียงรายการซ่อมเพิ่มเติม",
  });
  const [compatibleParts, setCompatibleParts] = useState([]);
  // บริการรายข้างท้ายแท็บซ้าย/ขวา เก็บแยกจากเซ็ตของอะไหล่
  // เพราะรหัสบริการกับรหัสอะไหล่เป็นคนละชุด ปนกันแล้วจะชนกันเอง
  const [perSideService, setPerSideService] = useState(null);
  const [perSideServiceSides, setPerSideServiceSides] = useState({
    left: false,
    right: false,
  });
  const [isPartsLoaded, setIsPartsLoaded] = useState(false);
  const [selectedLeftParts, setSelectedLeftParts] = useState(new Set());
  // จำนวนของที่ติ๊กในแท็บ เก็บเฉพาะที่มากกว่าหนึ่ง กุญแจคือ "ฝั่ง:รหัสอะไหล่" (ดู tabQty)
  const [tabQuantities, setTabQuantities] = useState({});
  const initialTabQuantitiesRef = useRef({});
  const [selectedRightParts, setSelectedRightParts] = useState(new Set());
  const [selectedOtherParts, setSelectedOtherParts] = useState(new Set());
  const [activeTab, setActiveTab] = useState("left");
  // ทิศที่เนื้อหาเลื่อนเข้ามา อิงจากตำแหน่งแท็บเดิม กดไปทางขวาก็เลื่อนเข้าจากขวา
  const [slideFrom, setSlideFrom] = useState("right");
  const [isLoading, setIsLoading] = useState(false);
  const [restoredStockMap, setRestoredStockMap] = useState({});
  // หน้าสรุปย้ายก้อนช่วงล่างไปไว้ระหว่างรายการซ่อมเพิ่มเติมได้ หน้านี้แค่จำตำแหน่งไว้ส่งต่อ
  // = จำนวนรายการซ่อมเพิ่มเติมที่อยู่ก่อนก้อนช่วงล่างในบิล
  // ไม่มีช่องในฐานข้อมูล ลำดับในบิลคือตัวบันทึก ตอนเปิดแก้ไขหรือย้อนกลับมาอ่านจากลำดับบรรทัด
  const [tabBlockIndex, setTabBlockIndex] = useState(0);

  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  // ดูรูปกับข้อมูลของอะไหล่ก่อนตัดสินใจเลือก
  const [previewPart, setPreviewPart] = useState(null);
  const [priceOverrides, setPriceOverrides] = useState({});
  const restoredRef = useRef(false);
  const [_isMoreFieldsVisible, setIsMoreFieldsVisible] = useState(false);
  const [isCustomerInfoOpen, setIsCustomerInfoOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  // กู้ร่างได้ครั้งเดียวตอนเปิดหน้า ไม่งั้นร่างที่บันทึกระหว่างพิมพ์จะย้อนทับสิ่งที่พิมพ์อยู่
  const draftRestoredRef = useRef(false);
  // บริการตั้งต้นของบิลช่วงล่าง — หามาจากชื่อ เพราะ id ไม่ตรงกันระหว่างเครื่อง
  const [defaultServices, setDefaultServices] = useState([]);

  // แก้บิลเดิมไม่ต้องเก็บร่าง ของจริงอยู่ในฐานข้อมูลแล้ว
  // และร่างของบิลเก่าไม่ควรไปโผล่ตอนเปิดบิลใหม่
  // ยึดค่าไว้ตลอดอายุของหน้า ถ้าอ่านจาก location.state สดๆ อย่างเดียว
  // จังหวะที่ state หลุดระหว่างทางจะกลายเป็นบิลเดิมถูกเก็บเป็นร่างของบิลใหม่
  const editingRef = useRef(!!location.state?.editRepairId);
  if (location.state?.editRepairId) editingRef.current = true;
  const isEditing = editingRef.current;

  // แก้บิลเดิมอยู่แล้วอยากกลับโดยไม่บันทึก ถอยกลับไปที่หน้าบิลใบนั้น
  // ใช้ตำแหน่งในประวัติเดียวกับตอนบันทึก (backIdx) เพราะถ้าเคยย้อนไปมากับหน้าสรุป
  // จะมีหน้ากรอกบิลซ้อนอยู่ในประวัติ ถอยทีละหน้าจะวนกลับมาเจอหน้ากรอกบิลอีก
  // เปิดบิลใหม่จากหน้าประวัติรถ = มีทางกลับไปหน้านั้น (vehicleId ติดมาตลอดทางรวมถึงหน้าสรุป)
  const canReturnToVehicle =
    !isEditing &&
    !!(location.state?.vehicleId ?? window.history.state?.usr?.vehicleId);

  const handleCancelEdit = () => {
    const backIdx =
      location.state?.backIdx ?? window.history.state?.usr?.backIdx;
    const currentIdx = window.history.state?.idx;
    const targetIdx = backIdx + 1;
    if (
      typeof backIdx === "number" &&
      typeof currentIdx === "number" &&
      targetIdx >= 0 &&
      targetIdx < currentIdx
    ) {
      navigate(targetIdx - currentIdx);
    } else {
      navigate(-1);
    }
  };

  // ถอยกลับไปหน้าประวัติรถ = ไม่เอาบิลนี้แล้ว ร่างที่เพิ่งเติมให้ไม่ควรค้างไปโผล่ตอนเปิดบิลใหม่
  const handleBackToVehicle = () => {
    clearDraft(DRAFT_SUSPENSION);
    handleCancelEdit();
  };

  const initialSelectedRef = useRef({
    left: new Set(),
    right: new Set(),
    other: new Set(),
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchVehicleModels();
  }, []);

  useEffect(() => {
    if (!isPartsLoaded) return;
    if (compatibleParts.length === 0) return;

    setRepairItems((prev) => {
      if (restoredRef.current) {
        restoredRef.current = false;
        return prev;
      }

      // ยังไม่รู้ id ของบริการตั้งต้น (ต่างกันแต่ละเครื่อง) ก็ยังไม่ต้องใส่
      if (defaultServices.length === 0) return prev;

      // เช็กทีละตัว ตัวที่อยู่ในบิลแล้วไม่ใส่ซ้ำ ตัวที่ยังไม่มีค่อยเติม
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
    // withRowId สร้างใหม่ทุกเรนเดอร์ ใส่ไว้จะเติมบริการตั้งต้นวนไม่หยุด
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compatibleParts, isPartsLoaded, defaultServices]);

  // ดึงบริการตั้งต้นของบิลช่วงล่างมาเตรียมไว้
  useEffect(() => {
    let cancelled = false;

    listInventory("บริการ", null)
      .then((res) => {
        if (cancelled) return;

        // เรียงตามลำดับในลิสต์ ไม่ใช่ลำดับที่คลังส่งมา
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
      .catch(() => {
        // ดึงไม่ได้ก็แค่ไม่มีบรรทัดตั้งต้น ช่างเพิ่มเองได้จากปุ่มเพิ่มรายการซ่อม
      });

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

    // รถรุ่นนี้ไม่มีอะไหล่ช่วงล่างผูกไว้ = เช็กตามตำแหน่งไม่ได้ บรรทัดตั้งต้นที่ใส่ให้ตอนแรกจึงต้องเอาออก
    // เทียบด้วยชื่อชุดเดียวกับตอนใส่ ไม่ใช่ไล่รหัสที่ต่างกันแต่ละเครื่อง (เดิมดักรหัส 1 ไว้ตรงๆ)
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

  useEffect(() => {
    // ไม่มี state แปลว่าเข้าหน้านี้ตรงๆ — ถ้ามีร่างค้างไว้ให้กู้กลับมา
    // (ออกไปเพิ่มสต็อกกลางคัน กดย้อนกลับพลาด หรือเครื่องรีเฟรชหน้าเอง)
    // ใช้ state เฉพาะตอนที่มีข้อมูลบิลติดมาจริง ย้อนกลับมาจากหน้าอื่นจะเหลือแค่ทางกลับที่ตัดเก็บไว้
    // ถ้าถือเป็น state จะไม่ได้ของที่กรอกคืน แก้บิลเดิมไม่มีร่างของตัวเอง ห้ามไปหยิบร่างบิลใหม่มาใส่
    const navState =
      location.state?.repairData || location.state?.repairItems
        ? location.state
        : null;
    const restored =
      navState ||
      (!isEditing && !draftRestoredRef.current && loadDraft(DRAFT_SUSPENSION));
    draftRestoredRef.current = true;
    // บอกให้รู้ว่าของที่เห็นมาจากไหน ไม่งั้นเปิดหน้าบิลใหม่แล้วเจอข้อมูลกรอกไว้จะงงว่าซ้ำกับอะไร
    if (restored && !navState) toast.info("กู้คืนข้อมูลที่กรอกค้างไว้แล้ว");
    if (!restored) return;

    const {
      repairData,
      repairItems: savedItems,
      editRepairId,
      hideMoreFields,
      scrollToItems,
    } = restored;

    // มาจากปุ่มแก้ไขรายการซ่อม -> พาไปที่หัวข้อของส่วนรายการ ไม่ใช่ล่างสุดของหน้า
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
      // บริการรายข้างก็มีข้างเหมือนอะไหล่ แยกออกมาก่อนไม่ให้ปนเข้าเซ็ตของอะไหล่
      const isPerSideServiceItem = (i) =>
        !i.partNumber && i.name === PER_SIDE_SERVICE_NAME;
      // แท็บมีแต่อะไหล่ช่วงล่างของรุ่นรถนี้ ที่เหลือกลับไปอยู่รายการซ่อมเพิ่มเติม
      const isTabItem = isSuspensionTabItem;
      const tabItems = savedItems.filter(isTabItem);
      const firstTabIndex = savedItems.findIndex(isTabItem);
      setTabBlockIndex(
        firstTabIndex === -1
          ? 0
          : collapseSidePairs(savedItems.slice(0, firstTabIndex)).length,
      );
      // ซ้ายกับขวาของชิ้นเดียวกัน รวมกลับเป็นบรรทัดทั้งสองข้าง (L-R) แบบเดียวกับหน้างานซ่อม
      const manualItems = collapseSidePairs(
        savedItems.filter((i) => !isTabItem(i)),
      );
      setPerSideServiceSides({
        left: tabItems.some(
          (i) => i.side === "left" && isPerSideServiceItem(i),
        ),
        right: tabItems.some(
          (i) => i.side === "right" && isPerSideServiceItem(i),
        ),
      });
      const leftIds = tabItems
        .filter((i) => i.side === "left" && !isPerSideServiceItem(i))
        .map((i) => i.id);
      const rightIds = tabItems
        .filter((i) => i.side === "right" && !isPerSideServiceItem(i))
        .map((i) => i.id);
      const otherIds = tabItems
        .filter((i) => i.side === "other")
        .map((i) => i.id);

      // ราคาที่แก้ไว้ติดมากับรายการที่กู้คืน ต้องดึงกลับเข้า priceOverrides
      // ไม่งั้นราคาจะเด้งกลับเป็นราคาตั้งต้นทุกครั้งที่ย้อนกลับมาจากหน้าสรุป
      const restoredPrices = {};
      for (const it of tabItems) {
        if (it?.id != null && it?.sellingPrice != null) {
          restoredPrices[it.id] = Number(it.sellingPrice);
        }
      }
      setPriceOverrides((prev) => ({ ...prev, ...restoredPrices }));

      // บูชปีกนกข้างหนึ่งใส่ได้หลายตัว จำนวนติดมากับบรรทัดในบิล
      const restoredQuantities = {};
      for (const it of tabItems) {
        if (!isPerSideServiceItem(it) && Number(it.quantity) > 1) {
          restoredQuantities[`${it.side}:${it.id}`] = Number(it.quantity);
        }
      }
      setTabQuantities(restoredQuantities);
      initialTabQuantitiesRef.current = restoredQuantities;

      const leftSet = new Set(leftIds);
      const rightSet = new Set(rightIds);
      const otherSet = new Set(otherIds);
      setSelectedLeftParts(leftSet);
      setSelectedRightParts(rightSet);
      setSelectedOtherParts(otherSet);
      initialSelectedRef.current = {
        left: leftSet,
        right: rightSet,
        other: otherSet,
      };

      // เฉพาะบิลที่บันทึกแล้ว (แก้ไขบิลเดิม) — ของถูกหักจากคลังไปแล้ว ต้องบวกคืนตอนคำนวณว่าเบิกได้เท่าไหร่
      // ถ้าแค่ย้อนกลับมาจากหน้าสรุป คลังยังไม่ถูกหัก ถ้าบวกคืนจะกลายเป็นมีของมากกว่าความจริง
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
      // ย้อนกลับมาจากหน้าสรุปหรือแก้บิลเดิม รายการตั้งต้นถูกตัดสินไปแล้ว (อาจลบค่าแรงออกเอง) ไม่ต้องเติมซ้ำ
      // มาจากหน้างานซ่อมด้วยปุ่มเช็กช่วงล่างต่อ = เพิ่งเป็นงานช่วงล่าง ต้องเติมค่าแรงกับตั้งศูนย์ให้
      restoredRef.current = !restored.addSuspensionDefaults;
    }

    if (hideMoreFields) {
      setIsMoreFieldsVisible(false);
    } else {
      try {
        const hiddenInputs = Array.from(
          document.querySelectorAll('form input[type="hidden"]'),
        );
        const hasHiddenValue = hiddenInputs.some(
          (el) => el && el.value != null && String(el.value).trim() !== "",
        );
        if (hasHiddenValue) setIsMoreFieldsVisible(true);
      } catch {
        // ไม่ต้องทำอะไร: เป็นการ blur/focus เสริม ถ้าพลาดก็ไม่กระทบการทำงาน
      }
    }

    const preserved = {
      ...(editRepairId
        ? {
            editRepairId,
            stockNotDeducted: restored.stockNotDeducted,
            // ทางกลับหลังบันทึก ต้องรอดผ่านการล้าง state ของหน้านี้ไปด้วย
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
      // เก็บเฉพาะข้อมูลที่ยังต้องใช้ แต่ต้องคงฟิลด์ของตัวจัดการเส้นทางไว้ด้วย
      // (ลำดับหน้าในประวัติอยู่ในนั้น ถ้าเขียนทับทิ้งจะคำนวณทางกลับหลังบันทึกไม่ได้)
      window.history.replaceState(
        { ...window.history.state, usr: preserved },
        document.title,
        window.location.pathname,
      );
    }
    // กู้ข้อมูลครั้งเดียวตาม state ที่ส่งมา withRowId สร้างใหม่ทุกเรนเดอร์ ใส่ไว้จะกู้ซ้ำไม่หยุด
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, setValue, isEditing]);

  const fetchVehicleModels = async () => {
    try {
      const res = await listVehicleModels();
      setVehicleModels(res.data);

      const uniqueBrands = withOtherBrandLast([
        ...new Set(res.data.map((item) => item.brand)),
      ]);
      setBrands(uniqueBrands.map((brand) => ({ id: brand, name: brand })));
    } catch (error) {
      toastError(error);
    }
  };

  const fetchCompatibleParts = async (brand, model) => {
    try {
      const res = await listParts();
      const allParts = res.data;

      // หน้านี้เช็กเฉพาะงานช่วงล่าง อะไหล่หมวดอื่นที่บังเอิญระบุรุ่นรถไว้ (เช่นน้ำมัน)
      // ไม่ควรโผล่มาในแท็บตำแหน่ง ของพวกนั้นเพิ่มได้ที่รายการซ่อมเพิ่มเติมอยู่แล้ว
      const compatible = allParts.filter((part) => {
        if (part.category?.name !== SUSPENSION_CATEGORY) return false;
        if (!part.compatibleVehicles) return false;

        return part.compatibleVehicles.some(
          (vehicle) => vehicle.brand === brand && vehicle.model === model,
        );
      });

      // เรียงตามชื่อ — ชื่ออะไหล่ไทยขึ้นต้นด้วยชนิดของมันเสมอ (ลูกหมาก..., บูช..., คันส่ง...)
      // ของชนิดเดียวกันจึงมาอยู่ติดกันเองโดยไม่ต้องมีฟิลด์แยกชนิด
      setCompatibleParts(compatible.sort(byPartName));
    } catch (error) {
      toastError(error);
      setCompatibleParts([]);
    } finally {
      setIsPartsLoaded(true);
    }
  };

  // อะไหล่นอกหมวดช่วงล่าง (เช่นน้ำมัน) ไม่มีข้างซ้าย-ขวา จึงอยู่ช่องอื่นๆ เหมือนของที่ไม่แยกข้าง
  // ถ้าให้เลือกได้ทุกช่องจะเผลอบันทึกว่าติดตั้งข้างซ้าย/ขวา ซึ่งไม่มีความหมายและติดไปกับบิล
  const getPartsForSide = (side) => {
    return compatibleParts.filter((part) => {
      const perSide =
        part.category?.name === "ช่วงล่าง" && isPerSide(part.attributes);

      if (perSide) return side === "left" || side === "right";
      // อะไหล่ช่วงล่างที่ไม่ได้ติดตั้งแยกข้างทุกตัวไปอยู่แท็บอื่นๆ
      // (เดิมรับเฉพาะสามชนิดที่ระบุไว้ ตัวที่เหลือจึงหายไปทั้งที่ผูกกับรุ่นรถไว้แล้ว)
      return side === "other";
    });
  };

  const getAvailableModelsForBrand = () => {
    const selectedBrand = watch("brand");
    const modelsForBrand = vehicleModels
      .filter((item) => item.brand === selectedBrand)
      .map((item) => ({ id: item.model, name: item.model }));

    return modelsForBrand;
  };

  // ทะเบียนเก็บเป็น "ตัวอักษร เว้นวรรค ตัวเลข" ให้ตรงกับที่บันทึกไว้ตอนสร้างบิล
  const plateText =
    watch("plateLetters") && watch("plateNumbers")
      ? `${watch("plateLetters")} ${watch("plateNumbers")}`
      : "";

  // เลือกลูกค้าที่เคยบันทึกไว้ — เติมทั้งสามช่องให้ตรงกับที่เก็บไว้ แก้ทับได้ตามปกติ
  const handleSelectCustomer = (customer) => {
    setValue("name", customer.name || "", { shouldValidate: true });
    setValue("phoneNumber", customer.phoneNumber || "", {
      shouldValidate: true,
    });
    setValue("address", customer.address || "");
    setValue("taxId", customer.taxId || "", { shouldValidate: true });
  };

  // บริการรายข้างที่ติ๊กไว้ นับและคิดเงินรวมไปกับของในแท็บ
  const countPerSideService = () =>
    Number(!!perSideService && perSideServiceSides.left) +
    Number(!!perSideService && perSideServiceSides.right);

  const sumPerSideService = () =>
    countPerSideService() * (perSideService?.sellingPrice || 0);

  // จำนวนที่ติ๊กไว้ในแท็บทั้งสามฝั่ง (นับเฉพาะที่ยังอยู่ในรายการอะไหล่ที่ใช้ได้)
  const countSelectedInTabs = () =>
    Array.from(selectedLeftParts).filter((id) =>
      getPartsForSide("left").some((part) => part.id === id),
    ).length +
    Array.from(selectedRightParts).filter((id) =>
      getPartsForSide("right").some((part) => part.id === id),
    ).length +
    Array.from(selectedOtherParts).filter((id) =>
      getPartsForSide("other").some((part) => part.id === id),
    ).length +
    countPerSideService();

  const getTabSelectedCountForItem = (item) => {
    const part = compatibleParts.find((p) => isSamePart(item, p));
    if (!part) return 0;
    return (
      tabQty("left", part.id) +
      tabQty("right", part.id) +
      tabQty("other", part.id)
    );
  };

  const handlePriceClick = (index, item) => {
    try {
      const ae = document.activeElement;
      if (ae && ae instanceof HTMLElement) ae.blur();
    } catch {
      // ไม่ต้องทำอะไร: เป็นการ blur/focus เสริม ถ้าพลาดก็ไม่กระทบการทำงาน
    }

    setEditingItem({ source: "manual", index, ...item });
    setPriceDialogOpen(true);
  };

  const handlePriceConfirm = (payload) => {
    const newPrice = typeof payload === "number" ? payload : payload?.price;
    const newName = typeof payload === "object" ? payload?.name : undefined;

    if (!editingItem || newPrice == null) return;

    if (editingItem.source === "manual") {
      setRepairItems((prev) =>
        prev.map((item, i) =>
          i === editingItem.index
            ? {
                ...item,
                // กรอกมาเป็นเลขบวก บรรทัดส่วนลดต้องกลับเป็นลบก่อนเก็บ
                sellingPrice: isDiscountItem(item)
                  ? -Math.abs(newPrice)
                  : newPrice,
                // จำว่าชื่อนี้พิมพ์เอง เพื่อไม่ให้ถูกชื่อจากคลังเขียนทับตอนบันทึกและตอนย่อชื่อบนใบเสร็จ
                // ไม่ได้แก้ชื่อ (ยังตรงกับชื่อเต็มที่ประกอบจากคลัง) ปล่อยให้ประกอบจากคลังเหมือนเดิม
                ...(newName && newName !== getProductName(item)
                  ? { name: newName, hasCustomName: true }
                  : {}),
              }
            : item,
        ),
      );
    } else if (editingItem.source === "compatible" && editingItem.partId) {
      setPriceOverrides((prev) => ({
        ...prev,
        [editingItem.partId]: newPrice,
      }));
    }
  };

  const getPriceForPart = (part) => {
    if (!part) return 0;
    const override = priceOverrides?.[part.id];
    return Number(override != null ? override : part.sellingPrice) || 0;
  };

  const handleEditCompatiblePrice = (part) => {
    try {
      const ae = document.activeElement;
      if (ae && ae instanceof HTMLElement) ae.blur();
    } catch {
      // ไม่ต้องทำอะไร: เป็นการ blur/focus เสริม ถ้าพลาดก็ไม่กระทบการทำงาน
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

  const getRepairItemsCountExcludingLabor = () => {
    return repairItems.length;
  };

  const getAllowedUnitsForPart = (part) => {
    const stockQty =
      typeof part?.stockQuantity === "number"
        ? Math.max(part.stockQuantity, 0)
        : Infinity;
    const isSuspensionPart = part?.category?.name === "ช่วงล่าง";
    const initialCount = isSuspensionPart
      ? ["left", "right", "other"].reduce(
          (sum, side) =>
            sum +
            (initialSelectedRef.current[side].has(part.id)
              ? initialTabQuantitiesRef.current[`${side}:${part.id}`] || 1
              : 0),
          0,
        )
      : 0;
    if (stockQty === Infinity) return Infinity;
    return Math.max(stockQty, initialCount);
  };

  const isSamePart = (item, part) =>
    !!item?.partNumber &&
    (item.id === part.id ||
      (item.partNumber === part.partNumber &&
        item.brand === part.brand &&
        item.name === part.name));

  // ของชิ้นเดียวกันอาจถูกหยิบจาก "รายการซ่อมเพิ่มเติม" ด้วย ต้องนับรวมกัน
  // ไม่งั้นสองที่จะแย่งสต็อกก้อนเดียวกันโดยไม่รู้ตัว
  const getExtraItemsCountForPart = (part) =>
    repairItems.reduce(
      (sum, item) =>
        isSamePart(item, part) ? sum + (item.quantity || 0) : sum,
      0,
    );

  const getCurrentSelectedCountForPart = (part) =>
    tabQty("left", part.id) +
    tabQty("right", part.id) +
    tabQty("other", part.id) +
    getExtraItemsCountForPart(part);

  // ส่งของที่ติ๊กจากแท็บให้ไดอะล็อกรู้ด้วย จะได้หักสต็อกจากก้อนเดียวกัน
  // ชื่ออะไหล่ไทยขึ้นต้นด้วยชนิดของมันเสมอ (ลูกหมากล่าง, ลูกหมากบน, คันส่งกลาง)
  // จึงใช้คำแรกเป็นหัวข้อกลุ่มได้โดยไม่ต้องเพิ่มฟิลด์ใหม่
  // ข้อแลกเปลี่ยน: ถ้าตั้งชื่อไม่ตามแบบแผน อะไหล่ตัวนั้นจะกลายเป็นกลุ่มของตัวเอง
  // แท็บอื่นๆ จัดกลุ่มตามลิสต์ที่กำหนดไว้ ไม่ใช่ตามคำแรกของชื่อ
  // แท็บอื่นๆ จัดกลุ่มตามคำแรกของชื่อเหมือนแท็บซ้ายขวา
  // แต่สามชนิดที่ช่างไล่ตรวจประจำให้ขึ้นก่อนตามลำดับเดิม ที่เหลือเรียงตามตัวอักษรต่อท้าย
  const groupOtherParts = (parts) => {
    const groups = groupPartsByType(parts);
    const rank = (type) => {
      const index = OTHER_TAB_ORDER.indexOf(type);
      return index === -1 ? OTHER_TAB_ORDER.length : index;
    };

    return [...groups].sort(
      (a, b) =>
        rank(a.type) - rank(b.type) || thaiCollator.compare(a.type, b.type),
    );
  };

  const groupPartsByType = (parts) => {
    const groups = new Map();
    for (const part of parts) {
      const type = getPartType(part.name);
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type).push(part);
    }
    // เรียงกลุ่มตามลำดับที่ช่างไล่ตรวจ ชนิดที่ไม่อยู่ในลิสต์ตกไปท้ายสุดเรียงตามตัวอักษร
    const rank = (type) => {
      const index = SUSPENSION_PART_TYPE_ORDER.indexOf(type);
      return index === -1 ? SUSPENSION_PART_TYPE_ORDER.length : index;
    };

    return [...groups.entries()]
      .map(([type, items]) => ({ type, items }))
      .sort(
        (a, b) =>
          rank(a.type) - rank(b.type) || thaiCollator.compare(a.type, b.type),
      );
  };

  const getSelectedTabItems = () =>
    compatibleParts.flatMap((part) => {
      const count =
        tabQty("left", part.id) +
        tabQty("right", part.id) +
        tabQty("other", part.id);
      return count > 0 ? [{ ...part, quantity: count }] : [];
    });

  const handlePartSelection = (part, isSelected, side) => {
    if (!isSelected) setTabQty(side, part.id, 1);
    const _stockQty =
      typeof part?.stockQuantity === "number" ? part.stockQuantity : Infinity;
    const isLeftRight = isPerSide(part?.attributes);
    const allowedUnits = getAllowedUnitsForPart(part);

    if (side === "left") {
      setSelectedLeftParts((prev) => {
        const next = new Set(prev);
        if (isSelected) next.add(part.id);
        else next.delete(part.id);
        return next;
      });
      if (isSelected && isLeftRight && allowedUnits === 1) {
        setSelectedRightParts((prev) => {
          const next = new Set(prev);
          next.delete(part.id);
          return next;
        });
      }
    } else if (side === "right") {
      setSelectedRightParts((prev) => {
        const next = new Set(prev);
        if (isSelected) next.add(part.id);
        else next.delete(part.id);
        return next;
      });
      if (isSelected && isLeftRight && allowedUnits === 1) {
        setSelectedLeftParts((prev) => {
          const next = new Set(prev);
          next.delete(part.id);
          return next;
        });
      }
    } else if (side === "other") {
      setSelectedOtherParts((prev) => {
        const next = new Set(prev);
        if (isSelected) next.add(part.id);
        else next.delete(part.id);
        return next;
      });
    }
  };

  // บูชปีกนก (บน ล่าง เล็ก ใหญ่) กับสลักปีกนกล่าง ข้างหนึ่งใส่หลายตัว ที่เหลือข้างละชิ้นเดียว
  const allowsTabQuantity = (part) => {
    const type = getPartType(part?.name);
    return type.startsWith("บูชปีกนก") || type === "สลักปีกนกล่าง";
  };

  // ชิ้นที่ติ๊กในแท็บนับเป็นหนึ่ง ยกเว้นบูชปีกนกที่ข้างหนึ่งใส่ได้หลายตัว
  const tabQty = (side, partId) => {
    const selected =
      side === "left"
        ? selectedLeftParts
        : side === "right"
          ? selectedRightParts
          : selectedOtherParts;
    return selected.has(partId) ? tabQuantities[`${side}:${partId}`] || 1 : 0;
  };

  const setTabQty = (side, partId, quantity) =>
    setTabQuantities((prev) => {
      const next = { ...prev };
      if (quantity > 1) next[`${side}:${partId}`] = quantity;
      else delete next[`${side}:${partId}`];
      return next;
    });

  const isPartSelected = (partId, side) => {
    if (side === "left") return selectedLeftParts.has(partId);
    else if (side === "right") return selectedRightParts.has(partId);
    else if (side === "other") return selectedOtherParts.has(partId);
    return false;
  };

  const onInvalid = (errs) => {
    const firstErrorField = Object.keys(errs || {})[0];
    if (!firstErrorField) return;

    // ช่องที่ผิดอาจอยู่ในกล่องข้อมูลลูกค้าที่พับไว้ ถ้าไม่กางออกก่อน
    // การโฟกัสจะไม่เห็นอะไรเลย คนใช้จะงงว่ากดปุ่มแล้วไม่มีอะไรเกิดขึ้น
    if (CUSTOMER_FIELDS.includes(firstErrorField)) {
      setIsCustomerInfoOpen(true);
    }

    setTimeout(() => {
      const el = document.querySelector(`[name="${firstErrorField}"]`);
      const isVisible = el && el.type !== "hidden" && el.offsetParent !== null;
      const target = isVisible ? el : el?.parentElement || null;
      if (!target) return;

      // preventScroll สำคัญ — โดยปริยาย focus() จะกระโดดไปหาช่องทันที
      // แล้วการเลื่อนแบบนุ่มที่ตามมาก็ไม่เหลืออะไรให้เลื่อน ภาพที่เห็นคือเด้งพรึบ
      if (isVisible) el.focus?.({ preventScroll: true });
      target.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior: "smooth",
      });
    }, 200);
  };

  // อะไหล่ที่ติ๊กตามตำแหน่งเก็บไว้เป็นเซ็ตของ id ต้องคลี่กลับเป็นรายการเต็มก่อน
  // ทั้งตอนส่งไปหน้าสรุปและตอนเก็บร่าง
  const buildTabItems = () => [
    ...Array.from(selectedLeftParts)
      .map((id) => getPartsForSide("left").find((p) => p.id === id))
      .filter(Boolean)
      .map((part) => ({
        ...part,
        sellingPrice: getPriceForPart(part),
        quantity: tabQty("left", part.id),
        side: "left",
      })),
    ...Array.from(selectedRightParts)
      .map((id) => getPartsForSide("right").find((p) => p.id === id))
      .filter(Boolean)
      .map((part) => ({
        ...part,
        sellingPrice: getPriceForPart(part),
        quantity: tabQty("right", part.id),
        side: "right",
      })),
    ...Array.from(selectedOtherParts)
      .map((id) => getPartsForSide("other").find((p) => p.id === id))
      .filter(Boolean)
      .map((part) => ({
        ...part,
        sellingPrice: getPriceForPart(part),
        quantity: tabQty("other", part.id),
        side: "other",
      })),
    ...["left", "right"]
      .filter((side) => perSideService && perSideServiceSides[side])
      .map((side) => ({
        ...perSideService,
        sellingPrice: perSideService.sellingPrice,
        quantity: 1,
        side,
      })),
  ];

  const buildAllRepairItems = () => [
    ...repairItems.slice(0, tabBlockIndex),
    ...buildTabItems(),
    ...repairItems.slice(tabBlockIndex),
  ];

  // เก็บร่างไว้ระหว่างพิมพ์ จะได้ออกจากหน้าไปเพิ่มสต็อกแล้วกลับมากรอกต่อได้
  // หน่วงไว้ก่อนเขียนเพื่อไม่ให้เขียนลงเครื่องทุกตัวอักษรที่พิมพ์
  const watchedValues = watch();
  const draftItems = buildAllRepairItems();
  const draftKey = JSON.stringify({ watchedValues, draftItems });

  useEffect(() => {
    if (isEditing || !draftRestoredRef.current) return;

    // อะไหล่ที่ติ๊กไว้คลี่กลับเป็นรายการไม่ได้จนกว่ารายการอะไหล่ของรถรุ่นนั้นจะโหลดเสร็จ
    // ถ้าเขียนร่างตอนนี้ ของที่ติ๊กไว้จะหายไปจากร่างทั้งชุด
    if (watchedValues.brand && watchedValues.model && !isPartsLoaded) return;

    const timer = setTimeout(() => {
      const draft = { repairData: watchedValues, repairItems: draftItems };
      if (isDraftWorthSaving(draft)) saveDraft(DRAFT_SUSPENSION, draft);
      // ลบทุกช่องทิ้งเอง = ตั้งใจเริ่มใหม่ ร่างเดิมไม่ควรกลับมาอีก
      else clearDraft(DRAFT_SUSPENSION);
    }, 400);

    return () => clearTimeout(timer);
    // draftKey คือค่าที่แปลงเป็นข้อความแล้วของทั้งสองตัว ใส่ซ้ำจะกลายเป็นเทียบ
    // ที่อยู่อ้างอิงซึ่งเปลี่ยนทุกรอบเรนเดอร์ ตัวจับเวลาจะถูกตั้งใหม่ไม่หยุด
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, isEditing, isPartsLoaded]);

  // ล้างทุกอย่างเริ่มใหม่ เช่นลูกค้าเปลี่ยนใจ หรือกรอกผิดคันจนแก้ทีละช่องช้ากว่า
  const handleClearForm = () => {
    reset(EMPTY_FORM);
    // ช่องเบอร์รถที่กางไว้ยุบกลับเป็นปุ่มเล็กเหมือนฟอร์มใหม่
    setClearCount((count) => count + 1);
    setRepairItems([]);
    setSelectedLeftParts(new Set());
    setSelectedRightParts(new Set());
    setSelectedOtherParts(new Set());
    setPerSideServiceSides({ left: false, right: false });
    initialSelectedRef.current = {
      left: new Set(),
      right: new Set(),
      other: new Set(),
    };
    setPriceOverrides({});
    setTabQuantities({});
    initialTabQuantitiesRef.current = {};
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

      // บรรทัดทั้งสองข้างในรายการเพิ่มเติม แตกเป็นซ้ายหนึ่งขวาหนึ่งก่อนส่งไปหน้าสรุป (ฐานข้อมูลเก็บเป็นรายข้าง)
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
  // รถรุ่นนี้ยังไม่ได้ผูกอะไหล่ = เช็กตามตำแหน่งไม่ได้ ต้องเปลี่ยนเป็นงานซ่อมทั่วไป
  const hasNoCompatibleParts =
    hasVehicleSelected && compatibleParts.length === 0;

  // ปุ่มย้ายไปงานซ่อมทั่วไป คู่กับปุ่ม "เช็กช่วงล่างต่อ" ในหน้างานซ่อม
  // ย้ายได้เฉพาะตอนไม่ได้เลือกอะไหล่ช่วงล่างในแท็บ เพราะหน้างานซ่อมไม่มีแท็บซ้าย/ขวา/อื่นๆ ให้ของพวกนั้นไปอยู่
  // (รายการซ่อมเพิ่มเติมย้ายตามไปได้ทั้งหมด)
  const [isSwitchingToGeneral, setIsSwitchingToGeneral] = useState(false);
  const hasTabSelection =
    selectedLeftParts.size > 0 ||
    selectedRightParts.size > 0 ||
    selectedOtherParts.size > 0 ||
    countPerSideService() > 0;

  const handleSwitchButton = async () => {
    // หน่วงสั้นๆ ให้เห็นตัวหมุนก่อน ไม่งั้นกดแล้วเงียบจนไม่รู้ว่ากดติด
    setIsSwitchingToGeneral(true);
    await new Promise((resolve) => setTimeout(resolve, SUBMIT_FEEDBACK_MS));
    setIsSwitchingToGeneral(false);

    if (hasTabSelection) {
      toast.error("ยกเลิกอะไหล่ช่วงล่างที่เลือกไว้ก่อน");
      return;
    }
    handleSwitchToGeneralRepair();
  };

  // ยกข้อมูลที่กรอกไว้ไปด้วย ไม่ต้องพิมพ์ใหม่ทั้งชุดตอนรถจอดรออยู่
  const handleSwitchToGeneralRepair = () => {
    // บิลย้ายไปอยู่ในมือหน้างานซ่อมแล้ว ร่างของหน้านี้จึงหมดหน้าที่
    clearDraft(DRAFT_SUSPENSION);

    // ค่าแรงที่ยังไม่ได้ใส่ราคากับตั้งศูนย์ ระบบเติมให้เพราะเป็นบิลช่วงล่าง ไม่ได้เช็กช่วงล่างแล้วก็ไม่ต้องยกไป
    // ตั้งศูนย์ที่แถมกับยางยังต้องอยู่ ค่าแรงที่ใส่ราคาแล้วถือว่าช่างตั้งใจคิดเงิน
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
        // เลื่อนลงไปที่รายการซ่อมเลย เหมือนตอนกดเช็กช่วงล่างต่อจากหน้างานซ่อม
        // ข้อมูลรถกับลูกค้ายกมาครบแล้ว สิ่งที่อยากเห็นคือรายการที่ย้ายตามมา
        scrollToItems: true,
        // แก้บิลเดิมอยู่ต้องบอกต่อไปด้วย ไม่งั้นหน้างานซ่อมจะนึกว่าเป็นบิลใหม่
        // แล้วเก็บบิลนี้เป็นร่างไปโผล่ตอนเปิดบิลใหม่ และกดบันทึกจะกลายเป็นบิลซ้ำอีกใบ
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

  // แถบเลื่อนวางด้วย translateX ตามลำดับที่ ไม่คิดเปอร์เซ็นต์จากความกว้างเต็ม
  // เพราะกล่องมีขอบใน 4px ปุ่มจึงกว้าง (100% - 8px)/3 ถ้าคิดเป็น 33.33% แถบจะเยื้อง
  const renderTabs = () => (
    <div className="mx-[20px] mt-[16px] flex justify-center">
      <div
        role="tablist"
        className="relative flex w-full max-w-sm rounded-[10px] bg-gray-100 p-1"
      >
        <div
          aria-hidden="true"
          className="bg-gradient-primary absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/3)] rounded-[10px] shadow-lg duration-300 ease-out"
          style={{
            transform: `translateX(${TAB_ORDER.indexOf(activeTab) * 100}%)`,
          }}
        />
        {TAB_ORDER.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => goToTab(tab)}
            className={`relative z-10 flex h-10 flex-1 cursor-pointer items-center justify-center rounded-[10px] text-lg font-semibold duration-300 ease-out md:text-xl ${
              activeTab === tab ? "text-white" : "text-subtle-dark"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>
    </div>
  );

  const goToTab = (next) => {
    if (next === activeTab) return;
    setSlideFrom(
      TAB_ORDER.indexOf(next) > TAB_ORDER.indexOf(activeTab) ? "right" : "left",
    );
    setActiveTab(next);
  };

  // แผงเลือกอะไหล่ตามฝั่ง (ซ้าย/ขวา/อื่นๆ) ใช้ร่วมกันทั้ง mobile และ desktop
  // อนิเมชันมีไว้บอกว่าเนื้อหาเปลี่ยนตอนสลับแท็บ จึงใส่เฉพาะตอนมีรายการจริง
  // ข้อความว่างเปล่าอยู่นิ่งเหมือนหน้าอื่นในระบบ ไม่ต้องเด้งเข้ามา
  const renderPartPanel = (side) => (
    <div
      key={`panel-${side}-${slideFrom}`}
      className={`w-full ${
        getPartsForSide(side).length === 0
          ? ""
          : `animate-in fade-in duration-300 ease-out ${
              slideFrom === "right"
                ? "slide-in-from-right-16"
                : "slide-in-from-left-16"
            }`
      }`}
    >
      {getPartsForSide(side).length === 0 ? (
        <div className="flex h-[228px] flex-col items-center justify-center gap-[16px] px-[20px]">
          {/* แยกให้รู้ว่าต้องเลือกรถก่อน กดแท็บอื่นดู หรือรถรุ่นนี้เช็กตามตำแหน่งไม่ได้ */}
          <p className="text-subtle-light text-center text-xl text-balance md:text-[22px]">
            {!hasVehicleSelected
              ? "กรุณาเลือกยี่ห้อและรุ่นรถ"
              : compatibleParts.length === 0
                ? "ไม่มีอะไหล่ช่วงล่างของรถรุ่นนี้"
                : "ไม่พบอะไหล่ในตำแหน่งนี้"}
          </p>

          {hasNoCompatibleParts && (
            <button
              type="button"
              onClick={handleSwitchToGeneralRepair}
              className="border-primary text-primary bg-surface flex h-[41px] cursor-pointer items-center justify-center rounded-[20px] border px-[20px] text-lg font-semibold md:text-xl"
            >
              เปลี่ยนเป็นงานซ่อมทั่วไป
            </button>
          )}
        </div>
      ) : (
        (side === "other"
          ? groupOtherParts(getPartsForSide(side))
          : groupPartsByType(getPartsForSide(side))
        ).map((group) => (
          <div key={`${side}-${group.type}`}>
            <div className="mt-[16px] flex items-center gap-[8px] px-[20px]">
              <p className="text-subtle-dark text-lg font-semibold md:text-xl">
                {group.type}
              </p>
              <span className="text-subtle-light text-lg md:text-xl">
                ({group.items.length})
              </span>
              <div className="bg-subtle-light/40 h-px flex-1" />
            </div>
            {group.items.map((part) => {
              const selectedThis = isPartSelected(part.id, side);
              const allowedUnits = getAllowedUnitsForPart(part);
              const currentSelectedAll = getCurrentSelectedCountForPart(part);
              const isDisabled =
                !selectedThis && currentSelectedAll >= allowedUnits;
              const toggle = () => {
                if (isDisabled) return;
                handlePartSelection(part, !selectedThis, side);
              };

              return (
                <div key={`${side}-${part.id}`} className="mt-[16px] px-[20px]">
                  <div
                    role="button"
                    tabIndex={isDisabled ? -1 : 0}
                    aria-pressed={selectedThis}
                    aria-disabled={isDisabled || undefined}
                    onKeyDown={onKeyActivate(toggle)}
                    onClick={toggle}
                    // สูงเท่าการ์ดอื่นในระบบ ยอมให้ยืดได้เผื่อชื่อยาวสองบรรทัด
                    className={`shadow-primary flex min-h-[80px] w-full items-center justify-between gap-[8px] rounded-[10px] border-2 px-[8px] py-[8px] transition-colors duration-200 ${
                      selectedThis
                        ? "bg-primary/5 border-primary"
                        : "bg-surface border-transparent"
                    } ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                      {/* ยังไม่เลือก = กดดูรูปกับข้อมูลก่อนตัดสินใจ
                          เลือกแล้ว = กดแก้ราคา (ราคาที่แก้มีผลก็ต่อเมื่ออยู่ในบิลแล้ว) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedThis) {
                            handleEditCompatiblePrice(part);
                            return;
                          }
                          setPreviewPart(part);
                        }}
                        aria-label={
                          selectedThis
                            ? `แก้ไขราคา ${part.name}`
                            : `ดูรูป ${part.name}`
                        }
                        className="shadow-primary bg-surface flex h-[60px] w-[60px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-gray-200"
                      >
                        {part.secureUrl ? (
                          <img
                            src={part.secureUrl}
                            alt={part.name}
                            className="h-full w-full rounded-[10px] object-cover"
                          />
                        ) : (
                          <div className="text-subtle-light flex h-[60px] w-[60px] items-center justify-center">
                            <SparePart className="h-10 w-10" />
                          </div>
                        )}
                      </button>

                      <div className="flex min-w-0 flex-1 flex-col">
                        {renderProductInfo(part)}
                        {/* โชว์รหัสทุกใบตั้งแต่ยังไม่เลือก เพราะช่างไล่หาของจากรหัสเป็นหลัก
                            ส่วนรายละเอียดยาวไม่แน่นอน ไม่เอาขึ้นการ์ด ให้ไปอ่านในหน้าต่างแทน
                            (ยังไม่เลือก = กดที่รูป, เลือกแล้ว = กดที่ราคา) */}
                        {part.partNumber && (
                          <p className="text-subtle-dark truncate text-base leading-tight font-medium md:text-lg">
                            รหัสอะไหล่: {part.partNumber}
                          </p>
                        )}
                        {/* สต็อกหมดอยู่บรรทัดเดียวกับราคา ทางขวา การ์ดจึงสูงเท่าการ์ดอื่นเสมอ */}
                        <div className="flex items-center gap-[12px]">
                          {/* ราคากับดินสอเป็นปุ่มเดียวกัน สูง 44px ตามขนาดขั้นต่ำของเป้ากดบนมือถือ
                          (ระยะขอบในติดลบชดเชยไม่ให้การ์ดสูงขึ้น) — กดพลาดที่นี่ = ติ๊กเลือกอะไหล่
                          โดยไม่ตั้งใจ จึงต้องกดง่ายกว่าไอคอนเปล่าๆ 20px */}
                          <button
                            type="button"
                            onClick={(e) => {
                              if (!selectedThis) return;
                              e.stopPropagation();
                              handleEditCompatiblePrice(part);
                            }}
                            aria-label={
                              selectedThis
                                ? `แก้ไขราคา ${part.name}`
                                : `ราคา ${part.name}`
                            }
                            className="-my-[8px] flex h-[44px] w-fit cursor-pointer items-center gap-2 self-start"
                          >
                            <span
                              className={`text-xl leading-tight font-semibold duration-200 md:text-[22px] ${
                                selectedThis
                                  ? "text-primary"
                                  : "text-subtle-dark"
                              }`}
                            >
                              {formatCurrency(getPriceForPart(part))}
                            </span>
                            {selectedThis && (
                              <SquarePen className="text-primary h-5 w-5 shrink-0" />
                            )}
                          </button>
                          {isDisabled && (
                            <p className="text-destructive flex items-center gap-[4px] text-base leading-tight font-semibold md:text-lg">
                              <AlertTriangle className="text-destructive h-5 w-5" />
                              <span>สต็อกหมด</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* บูชปีกนกข้างหนึ่งใส่ได้หลายตัว เลือกแล้วขึ้นปุ่มจำนวนแทนวงกลม หน้าตาเดียวกับรายการซ่อมเพิ่มเติม
                        ลดจนเหลือศูนย์ = เอาออก เหมือนกดการ์ดซ้ำ */}
                    {selectedThis && allowsTabQuantity(part) ? (
                      <div className="flex shrink-0 items-center gap-[4px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const quantity = tabQty(side, part.id);
                            if (quantity <= 1) {
                              handlePartSelection(part, false, side);
                              return;
                            }
                            setTabQty(side, part.id, quantity - 1);
                          }}
                          aria-label={
                            tabQty(side, part.id) <= 1
                              ? "เอารายการออก"
                              : "ลดจำนวน"
                          }
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-primary min-w-[28px] text-center text-lg font-semibold md:text-xl">
                          {tabQty(side, part.id)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTabQty(side, part.id, tabQty(side, part.id) + 1);
                          }}
                          disabled={currentSelectedAll >= allowedUnits}
                          aria-label="เพิ่มจำนวน"
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100 disabled:bg-gray-50 disabled:text-gray-300"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      /* ยังไม่เลือก = วงกลมเปล่ามีเส้นขอบ / เลือกแล้ว = ทึบมีเครื่องหมายถูก
                    เป็นส่วนหนึ่งของการ์ด ไม่ใช่ปุ่มแยก เพราะกดที่ไหนในการ์ดก็เลือกได้อยู่แล้ว */
                      <div
                        className={`flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
                          selectedThis
                            ? "bg-gradient-primary text-surface border-transparent"
                            : "border-subtle-mid text-transparent"
                        }`}
                      >
                        <Check className="h-[16px] w-[16px]" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}

      {/* บริการรายข้าง อยู่ล่างสุดของแท็บซ้าย/ขวา ต่อจากอะไหล่ทุกกลุ่ม
          หน้าตาเหมือนการ์ดอะไหล่ทุกอย่าง ต่างแค่ไม่มีสต็อกให้ชน */}
      {perSideService &&
        (side === "left" || side === "right") &&
        getPartsForSide(side).length > 0 && (
          <div>
            <div className="mt-[16px] flex items-center gap-[8px] px-[20px]">
              <p className="text-subtle-dark text-lg font-semibold md:text-xl">
                บริการ
              </p>
              <span className="text-subtle-light text-lg md:text-xl">(1)</span>
              <div className="bg-subtle-light/40 h-px flex-1" />
            </div>
            {(() => {
              const selectedThis = perSideServiceSides[side];
              const toggle = () =>
                setPerSideServiceSides((prev) => ({
                  ...prev,
                  [side]: !prev[side],
                }));
              return (
                <div className="mt-[16px] px-[20px]">
                  <div
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedThis}
                    onKeyDown={onKeyActivate(toggle)}
                    onClick={toggle}
                    className={`shadow-primary flex min-h-[80px] w-full cursor-pointer items-center justify-between gap-[8px] rounded-[10px] border-2 px-[8px] py-[8px] transition-colors duration-200 ${
                      selectedThis
                        ? "bg-primary/5 border-primary"
                        : "bg-surface border-transparent"
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                      <div className="shadow-primary bg-surface flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[10px] border border-gray-200">
                        <div className="text-subtle-light flex h-[60px] w-[60px] items-center justify-center">
                          {/* บริการใช้ประแจเหมือนที่อื่นในระบบ ไม่ใช่น็อตของอะไหล่ */}
                          <Wrench className="h-9 w-9" />
                        </div>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        {renderProductInfo(perSideService)}
                        <span
                          className={`text-xl leading-tight font-semibold duration-200 md:text-[22px] ${
                            selectedThis ? "text-primary" : "text-subtle-dark"
                          }`}
                        >
                          {formatCurrency(perSideService.sellingPrice)}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
                        selectedThis
                          ? "bg-gradient-primary text-surface border-transparent"
                          : "border-subtle-mid text-transparent"
                      }`}
                    >
                      <Check className="h-[16px] w-[16px]" />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
    </div>
  );

  // ยอดของในแท็บ (ซ้าย/ขวา/อื่นๆ รวมบริการรายข้าง) กับรายการซ่อมเพิ่มเติม ใช้ทั้งกล่องสรุปและปุ่มถัดไป
  const tabTotal =
    ["left", "right", "other"].reduce(
      (sum, side) =>
        sum +
        getPartsForSide(side).reduce(
          (total, part) =>
            total + getPriceForPart(part) * tabQty(side, part.id),
          0,
        ),
      0,
    ) + sumPerSideService();
  const extrasTotal = repairItems.reduce(
    (total, item) => total + item.sellingPrice * item.quantity,
    0,
  );

  const summaryBox = (
    <BillTotal
      count={countSelectedInTabs() + getRepairItemsCountExcludingLabor()}
      total={tabTotal + extrasTotal}
      className="mt-[16px] mb-[16px]"
    />
  );

  // ส่วนรายการซ่อม (แท็บช่วงล่าง + รายการเพิ่มเติม + สรุป) ใช้ทั้งฝั่งมือถือและจอใหญ่
  // จอใหญ่อยู่นอกฟอร์ม ปุ่มถัดไปจึงต้องผูกกับฟอร์มด้วยชื่อ และไม่ต้องเว้นที่ให้แถบเมนูล่าง
  const renderItemsSection = (isDesktop) => (
    <>
      <div
        data-repair-items-top
        className="flex items-center gap-[8px] px-[20px] pt-[16px]"
      >
        <div className="bg-primary/10 flex h-[40px] w-[40px] items-center justify-center rounded-full">
          <ClipboardList className="text-primary h-6 w-6" />
        </div>
        <p className="text-[22px] font-semibold md:text-2xl">
          รายการซ่อมช่วงล่าง
        </p>
      </div>
      {/* แท็บตำแหน่งมีไว้เลือกอะไหล่ ถ้าไม่มีอะไหล่ให้เลือกก็ไม่ต้องแสดง */}
      {compatibleParts.length > 0 && renderTabs()}
      {/* กันการล้นตอนแผงไถลเข้ามา ไม่งั้นหน้าจะกว้างขึ้นชั่วขณะแล้วจัดตำแหน่งใหม่ทั้งหน้า
          ใช้ clip ไม่ใช่ hidden — hidden จะบังคับแกนตั้งเป็น auto ด้วย แล้วไปตัดเงาการ์ดที่ขอบล่าง */}
      <div className="overflow-x-clip">{renderPartPanel(activeTab)}</div>
      {hasVehicleSelected &&
        (!hasNoCompatibleParts || repairItems.length > 0) && (
          <div className="flex items-center justify-between gap-[8px] px-[20px] pt-[16px]">
            {/* หัวข้อย่อยใต้ "รายการซ่อมช่วงล่าง" จึงเล็กกว่าหนึ่งขั้น
                แถวนี้มีทั้งหัวข้อ ปุ่มของแถม ปุ่มจัดเรียง และปุ่มเพิ่มรายการ
                จอแคบจึงย่อตัวอักษรลงหนึ่งขั้น แทนการตัดคำให้สั้น */}
            <div className="flex min-w-0 items-center gap-[8px]">
              <p className="text-lg font-semibold sm:text-xl md:text-[22px]">
                รายการซ่อมเพิ่มเติม
              </p>
              {freebieButton}
              {reorderButton}
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
        <div className={isDesktop ? "" : "h-[96px] lg:h-0"} />
      ) : (
        <div
          className={
            repairItems.length > 0 && !isDesktop ? "pb-[96px] xl:pb-0" : ""
          }
        >
          {renderItemRows({
            onRowClick: handlePriceClick,
            transitionPrefix: "suspension-item",
          })}
          {compatibleParts.length > 0 && (
            <>
              {summaryBox}
              <div
                className={`flex justify-center ${
                  isDesktop || repairItems.length > 0
                    ? "pb-[16px]"
                    : "pb-[112px]"
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
                  <CarRepair color="#ffffff" className="h-6 w-6 xl:hidden" />
                  <CarRepair
                    color="#1976d2"
                    className="hidden h-6 w-6 xl:block"
                  />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-surface xl:text-primary truncate text-2xl font-semibold md:text-[26px]">
                  {/* ใบประเมินราคายังไม่ใช่งานซ่อม (ดูได้จาก stockNotDeducted ที่หน้ารายละเอียดส่งมา) */}
                  {isEditing
                    ? location.state?.stockNotDeducted
                      ? "แก้ไขใบประเมินราคา"
                      : "แก้ไขงานซ่อม"
                    : "เช็กช่วงล่าง"}
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
              onSelectCustomer={handleSelectCustomer}
            />

            <VehicleFields
              register={register}
              errors={errors}
              watch={watch}
              setValue={setValue}
              brands={brands}
              modelOptions={getAvailableModelsForBrand()}
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

            <div className="mt-[16px] flex justify-center px-[20px]">
              <button
                type="button"
                onClick={handleSwitchButton}
                disabled={isSwitchingToGeneral}
                className="border-surface text-surface xl:border-primary xl:text-primary flex h-[41px] cursor-pointer items-center justify-center rounded-[20px] border px-[20px] text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-70 md:text-xl"
              >
                {isSwitchingToGeneral && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                เปลี่ยนเป็นงานซ่อมทั่วไป
              </button>
            </div>

            <div className="hidden pb-[24px] xl:block" />

            <div className="bg-surface shadow-primary mt-[16px] flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl xl:hidden">
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

      {itemDialogs}
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

export default SuspensionInspection;
