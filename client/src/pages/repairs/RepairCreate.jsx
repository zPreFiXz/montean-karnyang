import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Image,
  Wrench,
  Plus,
  Minus,
  ChevronDown,
  ContactRound,
  ClipboardList,
  X,
  ChevronUp,
  ArrowUpDown,
} from "lucide-react";
import FormInput from "@/components/forms/FormInput";
import CustomerNameInput from "@/components/forms/CustomerNameInput";
import LicensePlateInput from "@/components/forms/LicensePlateInput";
import AddRepairItemDialog from "@/components/dialogs/AddRepairItemDialog";
import EditPriceDialog from "@/components/dialogs/EditRepairItemDialog";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import CollapsibleRow from "@/components/ui/CollapsibleRow";
import { scrollToNewRow } from "@/utils/scrollToNewRow";
import FormButton from "@/components/forms/FormButton";
import ComboBox from "@/components/ui/ComboBox";
import { listVehicleModels } from "@/api/vehicleModel";
import { repairSchema } from "@/utils/schemas";
import { provinces } from "@/constants/provinces";
import { formatCurrency, formatPhone, formatQuantity } from "@/utils/formats";
import { toastError } from "@/utils/handleError";
import { isFreeformService } from "@/constants/services";
import { formatProductName } from "@/utils/tireSize";
import {
  isTireCategoryName,
  allowsDecimalQuantity,
} from "@/constants/categories";
import { isPartPlaceholderItem } from "@/constants/services";
import { SparePart } from "@/components/icons/Icons";
import EditQuantityDialog from "@/components/dialogs/EditQuantityDialog";
import { onKeyActivate } from "@/utils/a11y";
import { withViewTransition } from "@/utils/viewTransition";
import { withOtherBrandLast } from "@/utils/vehicleBrand";
import {
  DRAFT_REPAIR,
  DRAFT_SUSPENSION,
  loadDraft,
  saveDraft,
  clearDraft,
  isDraftWorthSaving,
} from "@/utils/repairDraft";

const CUSTOMER_FIELDS = ["name", "address", "phoneNumber"];
const VEHICLE_FIELDS = [
  "brand",
  "model",
  "plateLetters",
  "plateNumbers",
  "province",
  "mileage",
];
const SUBMIT_FEEDBACK_MS = 400;

// ล้างฟอร์มต้องไล่ชื่อช่องให้ครบ — reset({}) เปล่าๆ ไม่ได้เขียนค่าว่างลงช่องที่ไม่ได้คุมด้วย React
// (ทะเบียน เลขกิโลเมตร รายละเอียด) ข้อความเดิมจึงค้างอยู่บนหน้าจอ
const EMPTY_FORM = {
  name: "",
  address: "",
  phoneNumber: "",
  brand: "",
  model: "",
  plateLetters: "",
  plateNumbers: "",
  province: "",
  mileage: "",
  description: "",
};

const RepairCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    formState,
    setValue,
    watch,
    getValues,
    reset,
  } = useForm({
    resolver: zodResolver(repairSchema),
  });
  const [isCustomerInfoOpen, setIsCustomerInfoOpen] = useState(false);
  // งานซ่อม = ผูกกับรถ, ขายอะไหล่ = ลูกค้าซื้อของกลับไปเอง ไม่ได้เอารถมา
  // GENERAL = งานซ่อมผูกกับรถ, SERVICE = งานบริการที่ไม่ต้องเก็บประวัติรถ, SALE = ขายอะไหล่หน้าร้าน
  // เกณฑ์ของ SERVICE คือ "ไม่ต้องเก็บประวัติรถ" ไม่ใช่ "ทำที่ไหน" — ปะยางมอเตอร์ไซค์ที่ร้านก็เข้าข่าย
  // เป็นแค่โหมดของหน้าจอ ตอนบันทึกยังเป็นบิลประเภท GENERAL แต่ส่ง noVehicle ไปด้วย
  const [billType, setBillType] = useState("GENERAL");
  const isSale = billType === "SALE";
  const isService = billType === "SERVICE";
  const hasNoVehicle = isSale || isService;
  const [repairItems, setRepairItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const [restoredStockMap, setRestoredStockMap] = useState({});
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [quantityItem, setQuantityItem] = useState(null);
  // โหมดจัดเรียง — แถวเปลี่ยนปุ่มลบ/เพิ่มจำนวนเป็นลูกศรขึ้นลง
  // ไม่โชว์ลูกศรค้างไว้ตลอด เพราะแถวมีปุ่มแน่นอยู่แล้วบนจอมือถือ
  const [isReordering, setIsReordering] = useState(false);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [removingIndex, setRemovingIndex] = useState(null);
  // แถวที่กำลังยุบตัวก่อนหายจริง (ดู CollapsibleRow)
  const [leavingIndex, setLeavingIndex] = useState(null);
  const leaveHandledRef = useRef(false);
  // แจกรหัสประจำแถวตอนของเข้ามาในบิล ใช้เป็น key ของ React และชื่อสำหรับอนิเมชันสลับที่
  // ต้องแจกเอง ไม่ใช้รหัสอะไหล่ เพราะบิลเดิมมีอะไหล่ตัวเดียวกันได้หลายแถว (ช่วงล่างซ้าย-ขวา)
  const nextRowId = useRef(0);
  const withRowId = (item) =>
    item.rowId ? item : { ...item, rowId: `row-${++nextRowId.current}` };

  // กู้ร่างได้ครั้งเดียวตอนเปิดหน้า ไม่งั้นร่างที่บันทึกระหว่างพิมพ์จะย้อนทับสิ่งที่พิมพ์อยู่
  const draftRestoredRef = useRef(false);
  // ข้อมูลรถที่ถูกล้างตอนสลับไปโหมดที่ไม่ผูกรถ เก็บไว้คืนให้เมื่อสลับกลับมา
  const vehicleFieldsRef = useRef({});
  const { errors } = formState;

  // แก้บิลเดิมไม่ต้องเก็บร่าง ของจริงอยู่ในฐานข้อมูลแล้ว
  // และร่างของบิลเก่าไม่ควรไปโผล่ตอนเปิดบิลใหม่
  // ยึดค่าไว้ตลอดอายุของหน้า ถ้าอ่านจาก location.state สดๆ อย่างเดียว
  // จังหวะที่ state หลุดระหว่างทางจะกลายเป็นบิลเดิมถูกเก็บเป็นร่างของบิลใหม่
  const editingRef = useRef(!!location.state?.editRepairId);
  if (location.state?.editRepairId) editingRef.current = true;
  const isEditing = editingRef.current;

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchVehicleModels();
  }, []);

  useEffect(() => {
    // ไม่มี state แปลว่าเข้าหน้านี้ตรงๆ — ถ้ามีร่างค้างไว้ให้กู้กลับมา
    // (ออกไปเพิ่มสต็อกกลางคัน กดย้อนกลับพลาด หรือเครื่องรีเฟรชหน้าเอง)
    const restored =
      location.state || (!draftRestoredRef.current && loadDraft(DRAFT_REPAIR));
    draftRestoredRef.current = true;
    // บอกให้รู้ว่าของที่เห็นมาจากไหน ไม่งั้นเปิดหน้าบิลใหม่แล้วเจอข้อมูลกรอกไว้จะงงว่าซ้ำกับอะไร
    if (restored && !location.state) toast.info("กู้คืนข้อมูลที่กรอกไว้แล้ว");

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
        if (location.state?.editRepairId) {
          for (const it of savedItems) {
            if (
              it?.partNumber &&
              it?.brand &&
              typeof it.quantity === "number"
            ) {
              const key = `${it.partNumber}|${it.brand}|${it.name || ""}`;
              map[key] = (map[key] || 0) + it.quantity;
            }
          }
        }
        setRestoredStockMap(map);

        // รายการที่กู้คืนมาไม่ได้ผ่านไดอะล็อก จึงยังไม่มีเพดานของปุ่มบวกติดมาด้วย
        setRepairItems(
          savedItems.map(withRowId).map((it) => {
            if (it.availableStock !== undefined) return it;
            const key = `${it.partNumber}|${it.brand}|${it.name || ""}`;
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
          ? { editRepairId: location.state.editRepairId }
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
        window.history.replaceState(
          preserved,
          document.title,
          window.location.pathname,
        );
      }
    }
  }, [location.state, setValue]);

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

  const getAvailableModelsForBrand = () => {
    const selectedBrand = watch("brand");
    const modelsForBrand = vehicleModels
      .filter((item) => item.brand === selectedBrand)
      .map((item) => ({ id: item.model, name: item.model }));

    return modelsForBrand;
  };

  const renderProductInfo = (item) => {
    return (
      <p className="text-normal line-clamp-1 w-full text-base leading-tight font-semibold md:text-lg">
        {formatProductName({
          brand: item.brand,
          name: item.name,
          attributes: item.attributes,
          isTire: isTireCategoryName(item.category?.name),
        })}
      </p>
    );
  };

  // เลือกลูกค้าที่เคยบันทึกไว้ — เติมทั้งสามช่องให้ตรงกับที่เก็บไว้ แก้ทับได้ตามปกติ
  const handleSelectCustomer = (customer) => {
    setValue("name", customer.name || "", { shouldValidate: true });
    setValue("phoneNumber", customer.phoneNumber || "", {
      shouldValidate: true,
    });
    setValue("address", customer.address || "");
  };

  // ลูกค้าขอเช็กช่วงล่างเพิ่มระหว่างที่เปิดบิลเปลี่ยนยางค้างไว้ — ยกทั้งข้อมูลรถและรายการที่เลือกไปด้วย
  // จะได้อยู่ในบิลเดียวกัน ไม่ต้องเปิดบิลใหม่แล้วเก็บเงินสองรอบ (ขากลับมีอยู่แล้วที่หน้าเช็กช่วงล่าง)
  const handleAddSuspensionCheck = () => {
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
        editRepairId: location.state?.editRepairId,
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
    setRepairItems([]);
    setRestoredStockMap({});
    setBillType("GENERAL");
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

  const handleAddItemToRepair = (item) => {
    setRepairItems((prev) => {
      const index = prev.findIndex(
        (i) =>
          i.partNumber === item.partNumber &&
          i.brand === item.brand &&
          i.name === item.name,
      );
      if (index !== -1) {
        return prev.map((i, idx) => {
          if (idx !== index) return i;

          // เลือกซ้ำจากไดอะล็อกไม่ได้ผ่านปุ่มบวก จึงต้องกันเพดานตรงนี้ด้วย
          const limit = i.availableStock ?? i.stockQuantity ?? 0;
          const capped =
            i.partNumber && i.brand
              ? Math.min(i.quantity + 1, limit)
              : i.quantity + 1;

          return { ...i, quantity: capped };
        });
      } else {
        return [
          ...prev,
          withRowId({
            ...item,
            // จำไว้ว่าบรรทัดนี้เป็นอะไหล่ที่ซื้อมาใช้เลย ชื่อจะถูกพิมพ์ทับทีหลัง
            isPartLine: isPartPlaceholderItem(item),
            // ไดอะล็อกส่งสต็อกที่เบิกได้จริงมาทาง quantity (คิดสต็อกที่คืนจากบิลเดิมแล้ว)
            // เก็บไว้ก่อนถูกทับเป็น 1 เพื่อใช้เป็นเพดานของปุ่มบวก
            availableStock: item.quantity,
            quantity: 1,
            sellingPrice: item.sellingPrice,
            // ราคาตั้งต้นจากคลัง ไว้เทียบตอนแก้ราคา — sellingPrice จะถูกทับเมื่อปรับราคาให้ลูกค้า
            basePrice: item.sellingPrice,
          }),
        ];
      }
    });

    // เลื่อนไปหารายการที่เพิ่งเพิ่ม/เพิ่งเพิ่มจำนวน แทนการกระโดดลงล่างสุดของหน้า
    // (รายการถูกวาดสองชุดสำหรับมือถือ/เดสก์ท็อป จึงต้องหยิบชุดที่แสดงอยู่จริง)
    scrollToNewRow(() => {
      const rows = document.querySelectorAll("[data-repair-row]");
      const visible = [...rows].filter((el) => el.offsetParent !== null);
      return visible[visible.length - 1];
    });
  };

  // เบิกได้ไม่เกินสต็อกที่มีอยู่จริง ไม่เกี่ยวกับสต็อกขั้นต่ำ
  // availableStock มาจากไดอะล็อกเลือกอะไหล่ (คิดของที่คืนจากบิลเดิมแล้ว) ส่วนรายการที่กู้คืน
  // กลับมาจากหน้าอื่นไม่ได้ผ่านไดอะล็อก จึงถอยไปใช้สต็อกที่ติดมากับตัวอะไหล่
  // บริการและรายการที่พิมพ์ชื่อเองไม่มีสต็อก จึงไม่จำกัด
  const isAtStockLimit = (item) => {
    if (!item.partNumber || !item.brand) return false;
    const limit = item.availableStock ?? item.stockQuantity ?? 0;
    return item.quantity >= limit;
  };

  // เอารายการออกจนเหลือชิ้นเดียว ปุ่มสลับโหมดจะหายไป ถ้าไม่ปิดโหมดให้ด้วย
  // แถวจะค้างเป็นลูกศรโดยไม่มีทางกดออก
  useEffect(() => {
    if (repairItems.length < 2 && isReordering) setIsReordering(false);
  }, [repairItems.length, isReordering]);

  // เลื่อนแถวขึ้นลงทีละหนึ่งตำแหน่ง ให้เบราว์เซอร์วาดการสลับที่ให้ (ดู withViewTransition)
  const handleMoveItem = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= repairItems.length) return;

    withViewTransition(() =>
      setRepairItems((prev) => {
        const next = [...prev];
        [next[index], next[target]] = [next[target], next[index]];
        return next;
      }),
    );
  };

  const handleSetQuantity = (quantity) => {
    if (!quantityItem) return;
    setRepairItems((prev) =>
      prev.map((item, i) =>
        i === quantityItem.index ? { ...item, quantity } : item,
      ),
    );
  };

  const handleIncreaseQuantity = (index) => {
    setRepairItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  };

  const handleDecreaseQuantity = (index) => {
    setRepairItems((prev) =>
      prev.map((item, i) =>
        i === index && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item,
      ),
    );
  };

  // จำนวนเหลือ 1 แล้วกด − = เอารายการออก จึงถามยืนยันก่อน เพราะกดพลาดแล้วหายทั้งรายการ
  const handleRemoveItem = () => {
    leaveHandledRef.current = false;
    setLeavingIndex(removingIndex);
    setRemovingIndex(null);
  };

  // รายการถูกวาดสองชุด (มือถือ/เดสก์ท็อป) ทั้งคู่จึงเรียกตัวนี้เมื่อยุบเสร็จ
  // ถ้าไม่กันไว้ ครั้งที่สองจะไปลบรายการถัดไปที่เลื่อนขึ้นมาแทนที่
  const handleLeaveEnd = () => {
    if (leaveHandledRef.current) return;
    leaveHandledRef.current = true;

    setRepairItems((prev) => prev.filter((_, i) => i !== leavingIndex));
    setLeavingIndex(null);
  };

  const handlePriceClick = (index, item) => {
    setEditingItem({ index, ...item });
    setPriceDialogOpen(true);
  };

  const handlePriceConfirm = (payload) => {
    const newPrice = typeof payload === "number" ? payload : payload?.price;
    const newName = typeof payload === "object" ? payload?.name : undefined;

    if (editingItem && newPrice != null) {
      setRepairItems((prev) =>
        prev.map((item, i) =>
          i === editingItem.index
            ? {
                ...item,
                sellingPrice: newPrice,
                ...(newName ? { name: newName } : {}),
              }
            : item,
        ),
      );
    }
  };

  // บริการไม่มียี่ห้อ (null) — ต่อสตริงตรงๆ จะได้คำว่า "null" ติดมาหน้าชื่อ
  // ต่างจากการ์ดบนหน้าจอที่เขียนเป็น JSX ซึ่ง React ข้าม null ให้เอง
  const getProductName = (item) => {
    return formatProductName({
      brand: item.brand,
      name: item.name,
      attributes: item.attributes,
      isTire: isTireCategoryName(item.category?.name),
    });
  };

  // รหัสประจำแถว ใช้เป็นทั้ง key ของ React และชื่อสำหรับอนิเมชันสลับที่
  // ต้องผูกกับตัวรายการ ไม่ใช่ลำดับ ไม่งั้นตอนสลับ React จะแค่เปลี่ยนเนื้อหาในกล่องเดิม
  // เบราว์เซอร์เลยไม่เห็นว่ามีอะไรย้ายที่ จึงไม่วาดอนิเมชันให้
  //
  // ใช้รหัสที่แจกตอนของเข้ามาในบิล ไม่ใช่รหัสอะไหล่ เพราะบิลเดิมมีอะไหล่ตัวเดียวกันได้หลายแถว
  // (ช่วงล่างซ้าย-ขวา) ชื่อซ้ำกันแม้แถวเดียวก็ทำให้เบราว์เซอร์ยกเลิกอนิเมชันทั้งหน้า
  const itemKey = (item) => item.rowId;

  // ปุ่มเดียวกันวางสองที่ (มือถือ/จอใหญ่) ประกาศไว้ที่เดียวจะได้ไม่หลุดกันเวลาแก้
  // โผล่เมื่อมีของตั้งแต่สองรายการ เพราะมีชิ้นเดียวไม่มีอะไรให้สลับ
  const reorderButton = repairItems.length > 1 && (
    <button
      type="button"
      onClick={() => setIsReordering((prev) => !prev)}
      aria-pressed={isReordering}
      aria-label={isReordering ? "ออกจากโหมดจัดเรียง" : "จัดเรียงรายการซ่อม"}
      className={`flex h-[32px] w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] border duration-300 ${
        isReordering
          ? "bg-primary border-primary text-surface"
          : "text-subtle-dark border-gray-200 bg-gray-100"
      }`}
    >
      <ArrowUpDown className="h-4 w-4" />
    </button>
  );

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-[100svh] flex-col xl:min-h-[calc(100vh-73px)] xl:flex-row xl:items-start xl:gap-[16px] xl:bg-transparent xl:px-[16px] xl:pt-[24px] xl:pb-[24px] xl:shadow-none">
      <div className="xl:shadow-primary flex flex-1 flex-col xl:h-fit xl:w-1/2 xl:flex-initial xl:rounded-2xl xl:bg-white">
        <div className="flex items-center justify-between gap-[8px] px-[20px] pt-[16px]">
          <div className="flex min-w-0 items-center gap-[8px]">
            <div className="bg-surface/20 xl:bg-primary/10 flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full">
              <Plus color="#ffffff" className="xl:hidden" />
              <Plus className="text-primary hidden xl:block" />
            </div>
            <div className="min-w-0">
              <p className="text-surface xl:text-primary truncate text-2xl font-semibold md:text-[26px]">
                {isSale ? "ขายอะไหล่" : isService ? "งานบริการ" : "งานซ่อมใหม่"}
              </p>
            </div>
          </div>
          {/* โผล่เฉพาะตอนมีอะไรให้ล้างจริง ไม่ใช่ปุ่มที่กดแล้วไม่เกิดอะไรค้างอยู่บนหัวเรื่อง */}
          {hasAnythingToClear && (
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

          {/* ข้อมูลลูกค้า */}
          <div className="bg-surface mx-[20px] mt-[16px] overflow-hidden rounded-[10px]">
            <button
              type="button"
              onClick={() => setIsCustomerInfoOpen(!isCustomerInfoOpen)}
              aria-expanded={isCustomerInfoOpen}
              aria-controls="customer-info-panel"
              className="focus-visible:ring-primary/50 flex w-full cursor-pointer items-center justify-between px-[16px] py-[12px] outline-none focus-visible:ring-2 focus-visible:ring-inset"
            >
              <div className="flex items-center gap-[12px]">
                <div className="bg-primary/10 flex h-[40px] w-[40px] items-center justify-center rounded-full">
                  <ContactRound className="text-primary h-6 w-6" />
                </div>
                {/* ความสูงคงที่ ไม่งั้นหัวข้อจะขยับตอนพิมพ์ชื่อ — ไม่มีชื่อก็ให้หัวข้ออยู่กลางแทน */}
                <div className="flex min-h-[56px] flex-col justify-center text-left">
                  <p className="text-normal text-xl font-medium">
                    ข้อมูลลูกค้า
                  </p>
                  {/* กรอกแต่เบอร์ไม่กรอกชื่อก็ยังบอกได้ว่าเก็บอะไรไว้แล้ว
                      เบอร์เลื่อนขึ้นมาแทนที่ชื่อ ไม่ใช่ห้อยจุดคั่นไว้ข้างหน้าลอยๆ */}
                  {(watch("name") || watch("phoneNumber")) && (
                    <p className="text-subtle-dark line-clamp-1 text-lg md:text-xl">
                      {watch("name")}
                      {watch("name") && watch("phoneNumber") && " • "}
                      {watch("phoneNumber") &&
                        formatPhone(watch("phoneNumber"))}
                    </p>
                  )}
                </div>
              </div>
              <ChevronDown
                className={`text-subtle-dark h-6 w-6 transition-transform duration-200 motion-reduce:transition-none ${isCustomerInfoOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* ข้อมูลลูกค้า ที่ซ่อน/แสดง */}
            <div
              inert={!isCustomerInfoOpen}
              // grid-rows 0fr→1fr ขยายไปหาความสูงจริง ไม่ต้องเดาเป็นตัวเลข
              // (max-h ตายตัวจะตัดเนื้อหาทิ้งเมื่อทุกช่องขึ้นข้อความ error พร้อมกัน)
              id="customer-info-panel"
              className={`grid transition-all duration-200 motion-reduce:transition-none ${
                isCustomerInfoOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="space-y-[12px] px-[16px] pb-[16px]">
                  <CustomerNameInput
                    register={register}
                    errors={errors}
                    value={watch("name")}
                    onSelect={handleSelectCustomer}
                  />

                  <FormInput
                    register={register}
                    name="address"
                    label="ที่อยู่"
                    rows={2}
                    placeholder="เช่น 543 หมู่ 5 ต.น้ำอ้อม อ.กันทรลักษ์ จ.ศรีสะเกษ 33110"
                    color="subtle-dark"
                    errors={errors}
                    customClass="w-full"
                  />

                  <FormInput
                    register={register}
                    name="phoneNumber"
                    label="เบอร์โทรศัพท์"
                    type="text"
                    placeholder="เช่น 0812345678"
                    color="subtle-dark"
                    maxLength={10}
                    errors={errors}
                    inputMode="numeric"
                    onInput={(e) => {
                      e.target.value = e.target.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 10);
                    }}
                    customClass="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* ข้อมูลรถ — บิลขายอะไหล่หน้าร้านไม่มีรถมาเกี่ยว จึงซ่อนทั้งก้อน */}
          {!hasNoVehicle && (
            <>
              <div className="xl:[&_label]:text-normal mt-[16px] px-[20px]">
                <ComboBox
                  label="ยี่ห้อรถ"
                  color="text-surface"
                  options={brands}
                  value={watch("brand")}
                  onChange={(value) => {
                    setValue("brand", value, {
                      shouldValidate: true,
                      shouldTouch: true,
                    });
                    setValue("model", "", {
                      shouldValidate: true,
                      shouldTouch: true,
                    });
                  }}
                  placeholder="-- เลือกยี่ห้อรถ --"
                  errors={errors}
                  name="brand"
                />
                <input
                  {...register("brand")}
                  type="hidden"
                  value={watch("brand") || ""}
                />
              </div>

              <div className="xl:[&_label]:text-normal mt-[16px] px-[20px]">
                <ComboBox
                  label="รุ่นรถ"
                  color="text-surface"
                  options={getAvailableModelsForBrand()}
                  value={watch("model")}
                  onChange={(value) =>
                    setValue("model", value, {
                      shouldValidate: true,
                      shouldTouch: true,
                    })
                  }
                  placeholder="-- เลือกรุ่นรถ --"
                  errors={errors}
                  name="model"
                  disabled={!watch("brand")}
                />
                <input
                  {...register("model")}
                  type="hidden"
                  value={watch("model") || ""}
                />
              </div>

              {/* ป้ายทะเบียนรถ */}
              <div className="xl:[&_.text-surface]:text-normal px-[20px] pt-[16px]">
                <p className="text-surface mb-[8px] text-xl font-medium">
                  ทะเบียนรถ
                </p>
                <div className="flex items-start gap-[8px]">
                  <div className="w-[70px]">
                    <LicensePlateInput
                      register={register}
                      name="plateLetters"
                      placeholder="กก"
                      maxLength={3}
                      error={errors.plateLetters}
                      inputMode="numeric"
                      onInput={(e) => {
                        e.target.value = e.target.value
                          .replace(/[^ก-ฮ0-9]/g, "")
                          .slice(0, 3);
                      }}
                    />
                  </div>
                  <div className="w-[80px]">
                    <LicensePlateInput
                      register={register}
                      name="plateNumbers"
                      placeholder="1234"
                      maxLength={4}
                      error={errors.plateNumbers}
                      onInput={(e) => {
                        e.target.value = e.target.value
                          .replace(/[^0-9]/g, "")
                          .slice(0, 4);
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <ComboBox
                      label=""
                      color="text-surface"
                      options={provinces}
                      value={
                        provinces.find((p) => p.name === watch("province"))?.id
                      }
                      onChange={(value) => {
                        const provinceName =
                          provinces.find((p) => p.id === value)?.name || value;
                        setValue("province", provinceName, {
                          shouldValidate: true,
                          shouldTouch: true,
                        });
                      }}
                      placeholder="-- เลือกจังหวัด --"
                      errors={errors}
                      name="province"
                    />
                  </div>
                </div>
              </div>
              <FormInput
                register={register}
                name="mileage"
                label="เลขกิโลเมตร"
                type="number"
                placeholder="เช่น 120000"
                color="surface"
                errors={errors}
                inputMode="numeric"
                onWheel={(e) => e.target.blur()}
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, "");
                }}
              />
            </>
          )}
          <FormInput
            register={register}
            name="description"
            label={isSale ? "หมายเหตุ" : "รายละเอียดการซ่อม"}
            type="text"
            placeholder={
              isSale
                ? "เช่น สั่งของให้ลูกค้า ของถึงวันศุกร์"
                : "เช่น ค้างตั้งศูนย์, รอสั่งอะไหล่"
            }
            color="surface"
            errors={errors}
          />

          {!hasNoVehicle && (
            <div className="mt-[16px] flex justify-center px-[20px]">
              <button
                type="button"
                onClick={handleAddSuspensionCheck}
                className="border-surface text-surface xl:border-primary xl:text-primary flex h-[41px] cursor-pointer items-center justify-center rounded-[20px] border px-[20px] text-lg font-semibold md:text-xl"
              >
                เช็กช่วงล่างต่อ
              </button>
            </div>
          )}

          <div className="hidden pb-[24px] xl:block" />

          {/* Mobile: รายการซ่อม */}
          <div className="bg-surface shadow-primary mt-[16px] flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl xl:hidden">
            <div
              data-repair-items-top
              className="flex items-center justify-between px-[20px] pt-[16px]"
            >
              <div className="flex items-center gap-[8px]">
                <div className="bg-primary/10 flex h-[40px] w-[40px] items-center justify-center rounded-full">
                  <ClipboardList className="text-primary h-6 w-6" />
                </div>
                <p className="text-[22px] font-semibold md:text-2xl">
                  รายการซ่อม
                </p>
                {reorderButton}
              </div>
              <AddRepairItemDialog
                onAddItem={handleAddItemToRepair}
                selectedItems={repairItems}
                restoredStockMap={restoredStockMap}
                vehicle={{ brand: watch("brand"), model: watch("model") }}
              >
                <p className="text-primary cursor-pointer text-xl font-semibold md:text-[22px]">
                  + เพิ่มรายการซ่อม
                </p>
              </AddRepairItemDialog>
            </div>
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
                {repairItems.map((item, index) => (
                  <CollapsibleRow
                    key={itemKey(item)}
                    leaving={leavingIndex === index}
                    onLeaveEnd={handleLeaveEnd}
                  >
                    <div
                      data-repair-row={index}
                      // ชื่อนี้บอกเบราว์เซอร์ว่าแถวไหนคือแถวเดิม ตอนสลับที่จะได้วาดให้เลื่อนไป
                      // ใช้รหัสอะไหล่/บริการเป็นชื่อ เพราะรายการซ้ำถูกยุบเป็นแถวเดียวอยู่แล้ว
                      style={{
                        viewTransitionName: `repair-item-${itemKey(item)}`,
                      }}
                      className="mt-[16px] flex items-center gap-[16px] px-[20px]"
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={onKeyActivate(() => {
                          if (isReordering) return;
                          handlePriceClick(index, item);
                        })}
                        // โหมดจัดเรียงตั้งใจให้กดลูกศรอย่างเดียว กดโดนแถวแล้วเด้งหน้าต่างแก้ราคาจะกวน
                        onClick={() => {
                          if (isReordering) return;
                          handlePriceClick(index, item);
                        }}
                        className="shadow-primary bg-surface flex h-[92px] min-w-0 flex-1 cursor-pointer items-center justify-between gap-[8px] rounded-[10px] px-[8px]"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                          <div className="shadow-primary bg-surface flex h-[60px] w-[60px] items-center justify-center rounded-[10px] border border-gray-200">
                            {item.secureUrl ? (
                              <img
                                src={item.secureUrl}
                                alt={item.name}
                                className="h-full w-full rounded-[10px] object-cover"
                              />
                            ) : (
                              <div className="text-subtle-light flex h-[60px] w-[60px] items-center justify-center">
                                {/* งานบริการใช้ประแจ ที่เหลือคืออะไหล่ รวมถึงบรรทัด
                                    อะไหล่ที่ซื้อมาใช้เลยซึ่งระบบเก็บเป็นบริการ */}
                                {item.category?.name === "บริการ" &&
                                !isPartPlaceholderItem(item) ? (
                                  <Wrench className="h-9 w-9" />
                                ) : (
                                  <SparePart className="h-10 w-10" />
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col">
                            {renderProductInfo(item)}
                            <p className="text-subtle-light truncate text-base leading-tight font-medium md:text-lg">
                              {/* บริการไม่มีหน่วย จึงเหลือแค่ราคา */}
                              {formatCurrency(Number(item.sellingPrice))}
                              {item.unit ? `/${item.unit}` : ""}
                            </p>
                            <div className="flex w-full items-center justify-between">
                              <p className="text-primary text-xl leading-tight font-semibold text-nowrap md:text-[22px]">
                                {formatCurrency(
                                  item.quantity * item.sellingPrice,
                                )}
                              </p>
                              {isReordering ? (
                                <div className="flex shrink-0 items-center gap-[8px]">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveItem(index, -1);
                                    }}
                                    disabled={index === 0}
                                    aria-label="เลื่อนขึ้น"
                                    className="text-subtle-dark flex h-10 w-10 cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveItem(index, 1);
                                    }}
                                    disabled={index === repairItems.length - 1}
                                    aria-label="เลื่อนลง"
                                    className="text-subtle-dark flex h-10 w-10 cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div
                                  className="flex shrink-0 items-center gap-[8px]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (item.quantity <= 1) {
                                        setRemovingIndex(index);
                                        return;
                                      }
                                      handleDecreaseQuantity(index);
                                    }}
                                    aria-label={
                                      item.quantity <= 1
                                        ? "เอารายการออก"
                                        : "ลดจำนวน"
                                    }
                                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  {/* กดที่ตัวเลขเพื่อพิมพ์จำนวนเอง เร็วกว่ากดบวกทีละครั้ง
                                      และจำเป็นกับน้ำมันที่ขายเป็นลิตรครึ่งลิตร */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setQuantityItem({ index, item });
                                    }}
                                    aria-label={`แก้ไขจำนวนของ ${getProductName(item)}`}
                                    className="text-primary min-w-[32px] cursor-pointer text-lg font-semibold md:text-xl"
                                  >
                                    {formatQuantity(item.quantity)}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleIncreaseQuantity(index);
                                    }}
                                    disabled={isAtStockLimit(item)}
                                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100 disabled:bg-gray-50 disabled:text-gray-300"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleRow>
                ))}
                <div className="border-primary/20 from-primary/10 to-primary/5 mx-[20px] my-[16px] rounded-[10px] border bg-gradient-to-r p-[16px]">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-subtle-dark text-xl font-semibold md:text-[22px]">
                        รวม {repairItems.length} รายการ
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-primary text-2xl font-semibold md:text-[26px]">
                        {formatCurrency(
                          repairItems.reduce(
                            (total, item) =>
                              total + item.sellingPrice * item.quantity,
                            0,
                          ),
                        )}
                      </p>
                    </div>
                  </div>
                </div>
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
          <div
            data-repair-items-top
            className="flex items-center justify-between px-[20px] pt-[16px]"
          >
            <div className="flex items-center gap-[8px]">
              <div className="bg-primary/10 flex h-[40px] w-[40px] items-center justify-center rounded-full">
                <ClipboardList className="text-primary h-6 w-6" />
              </div>
              <p className="text-[22px] font-semibold md:text-2xl">
                รายการซ่อม
              </p>
              {reorderButton}
            </div>
            <AddRepairItemDialog
              onAddItem={handleAddItemToRepair}
              selectedItems={repairItems}
              restoredStockMap={restoredStockMap}
              vehicle={{ brand: watch("brand"), model: watch("model") }}
            >
              <p className="text-primary cursor-pointer text-xl font-semibold md:text-[22px]">
                + เพิ่มรายการซ่อม
              </p>
            </AddRepairItemDialog>
          </div>
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
              {repairItems.map((item, index) => (
                <CollapsibleRow
                  key={itemKey(item)}
                  leaving={leavingIndex === index}
                  onLeaveEnd={handleLeaveEnd}
                >
                  <div
                    data-repair-row={index}
                    // ชื่อเดียวกับฝั่งมือถือไม่ชนกัน เพราะอีกฝั่งถูกซ่อนด้วย display:none
                    // ตามขนาดจอ เบราว์เซอร์จึงถ่ายภาพแค่ฝั่งที่แสดงอยู่
                    style={{
                      viewTransitionName: `repair-item-${itemKey(item)}`,
                    }}
                    className="mt-[16px] flex items-center gap-[16px] px-[20px]"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onKeyDown={onKeyActivate(() => {
                        if (isReordering) return;
                        handlePriceClick(index, item);
                      })}
                      onClick={() => {
                        if (isReordering) return;
                        handlePriceClick(index, item);
                      }}
                      className="shadow-primary bg-surface flex h-[92px] min-w-0 flex-1 cursor-pointer items-center justify-between gap-[8px] rounded-[10px] px-[8px]"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                        <div className="shadow-primary bg-surface flex h-[60px] w-[60px] items-center justify-center rounded-[10px] border border-gray-200">
                          {item.secureUrl ? (
                            <img
                              src={item.secureUrl}
                              alt={item.name}
                              className="h-full w-full rounded-[10px] object-cover"
                            />
                          ) : (
                            <div className="text-subtle-light flex h-[60px] w-[60px] items-center justify-center">
                              {item.category?.name === "บริการ" &&
                              !isPartPlaceholderItem(item) ? (
                                <Wrench className="h-9 w-9" />
                              ) : (
                                <SparePart className="h-10 w-10" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          {renderProductInfo(item)}
                          <p className="text-subtle-light truncate text-base leading-tight font-medium md:text-lg">
                            {/* บริการไม่มีหน่วย จึงเหลือแค่ราคา */}
                            {formatCurrency(Number(item.sellingPrice))}
                            {item.unit ? `/${item.unit}` : ""}
                          </p>
                          <div className="flex w-full items-center justify-between">
                            <p className="text-primary text-xl leading-tight font-semibold text-nowrap md:text-[22px]">
                              {formatCurrency(
                                item.quantity * item.sellingPrice,
                              )}
                            </p>
                            {isReordering ? (
                              <div className="flex shrink-0 items-center gap-[8px]">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveItem(index, -1);
                                  }}
                                  disabled={index === 0}
                                  aria-label="เลื่อนขึ้น"
                                  className="text-subtle-dark flex h-10 w-10 cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveItem(index, 1);
                                  }}
                                  disabled={index === repairItems.length - 1}
                                  aria-label="เลื่อนลง"
                                  className="text-subtle-dark flex h-10 w-10 cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div
                                className="flex shrink-0 items-center gap-[8px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (item.quantity <= 1) {
                                      setRemovingIndex(index);
                                      return;
                                    }
                                    handleDecreaseQuantity(index);
                                  }}
                                  aria-label={
                                    item.quantity <= 1
                                      ? "เอารายการออก"
                                      : "ลดจำนวน"
                                  }
                                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setQuantityItem({ index, item });
                                  }}
                                  aria-label={`แก้ไขจำนวนของ ${getProductName(item)}`}
                                  className="text-primary min-w-[32px] cursor-pointer text-lg font-semibold md:text-xl"
                                >
                                  {formatQuantity(item.quantity)}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleIncreaseQuantity(index);
                                  }}
                                  disabled={isAtStockLimit(item)}
                                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100 disabled:bg-gray-50 disabled:text-gray-300"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleRow>
              ))}

              {/* Desktop: สรุปยอดรวม */}
              <div className="border-primary/20 from-primary/10 to-primary/5 mx-[20px] my-[16px] rounded-[10px] border bg-gradient-to-r p-[16px]">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-subtle-dark text-xl font-semibold md:text-[22px]">
                      รวม {repairItems.length} รายการ
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-primary text-2xl font-semibold md:text-[26px]">
                      {formatCurrency(
                        repairItems.reduce(
                          (total, item) =>
                            total + item.sellingPrice * item.quantity,
                          0,
                        ),
                      )}
                    </p>
                  </div>
                </div>
              </div>
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
        currentName={editingItem?.name || ""}
        canEditName={isFreeformService(editingItem)}
      />

      <EditQuantityDialog
        isOpen={!!quantityItem}
        onClose={() => setQuantityItem(null)}
        onConfirm={handleSetQuantity}
        currentQuantity={quantityItem?.item?.quantity ?? 1}
        productName={quantityItem ? getProductName(quantityItem.item) : ""}
        unit={quantityItem?.item?.unit || ""}
        // บริการไม่มีสต็อก จึงไม่จำกัดจำนวน
        maxQuantity={
          quantityItem?.item?.partNumber
            ? (quantityItem.item.availableStock ??
              quantityItem.item.stockQuantity)
            : undefined
        }
        allowDecimal={allowsDecimalQuantity(quantityItem?.item?.category?.name)}
      />

      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleClearForm}
        title="ยืนยันการล้างข้อมูล"
        itemName="ข้อมูลที่กรอกไว้ทั้งหมด"
        confirmLabel="ล้างข้อมูล"
      />

      <ConfirmDialog
        isOpen={removingIndex !== null}
        onClose={() => setRemovingIndex(null)}
        onConfirm={handleRemoveItem}
        title="ยืนยันการเอารายการออก"
        itemName={
          removingIndex !== null && repairItems[removingIndex]
            ? getProductName(repairItems[removingIndex])
            : ""
        }
      />
    </div>
  );
};

export default RepairCreate;
