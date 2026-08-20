import FormInput from "@/components/forms/FormInput";
import ComboBox from "@/components/ui/ComboBox";
import AddRepairItemDialog from "@/components/dialogs/AddRepairItemDialog";
import EditPriceDialog from "@/components/dialogs/EditRepairItemDialog";
import { useForm } from "react-hook-form";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { provinces } from "@/constants/provinces";
import { listVehicleModels } from "@/api/vehicleModel";
import { listParts } from "@/api/part";
import LicensePlateInput from "@/components/forms/LicensePlateInput";
import { formatCurrency } from "@/utils/formats";
import {
  Image,
  Plus,
  Minus,
  Check,
  Wrench,
  SquarePen,
  ChevronDown,
  AlertTriangle,
  ContactRound,
  ClipboardList,
} from "lucide-react";
import FormButton from "@/components/forms/FormButton";
import { zodResolver } from "@hookform/resolvers/zod";
import { repairSchema } from "@/utils/schemas";
import { CarRepair } from "@/components/icons/Icons";
import { toastError } from "@/utils/handleError";
import { onKeyActivate } from "@/utils/a11y";
import { isPerSide } from "@/utils/suspension";
import { scrollToNewRow } from "@/utils/scrollToNewRow";
import CollapsibleRow from "@/components/ui/CollapsibleRow";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { withOtherBrandLast } from "@/utils/vehicleBrand";

const CUSTOMER_FIELDS = ["name", "address", "phoneNumber"];

// ตัวเรียงภาษาไทย ก-ฮ และเลขเรียงตามค่า ไม่ใช่ตามตัวอักษร (2 มาก่อน 10)
const thaiCollator = new Intl.Collator("th", { numeric: true });
const byPartName = (a, b) => thaiCollator.compare(a?.name || "", b?.name || "");

const TAB_ORDER = ["left", "right", "other"];
// หน่วงสั้นๆ ให้เห็นตัวหมุนก่อนหน้าจอเปลี่ยน (ไม่ได้รอเซิร์ฟเวอร์ ข้อมูลส่งต่อผ่าน state ล้วน)
const SUBMIT_FEEDBACK_MS = 400;
const TAB_LABELS = { left: "ซ้าย", right: "ขวา", other: "อื่นๆ" };
const SuspensionInspection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(repairSchema),
  });
  const [vehicleModels, setVehicleModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const [repairItems, setRepairItems] = useState([]);
  const [compatibleParts, setCompatibleParts] = useState([]);
  const [isPartsLoaded, setIsPartsLoaded] = useState(false);
  const [selectedLeftParts, setSelectedLeftParts] = useState(new Set());
  const [selectedRightParts, setSelectedRightParts] = useState(new Set());
  const [selectedOtherParts, setSelectedOtherParts] = useState(new Set());
  const [activeTab, setActiveTab] = useState("left");
  // ทิศที่เนื้อหาเลื่อนเข้ามา อิงจากตำแหน่งแท็บเดิม กดไปทางขวาก็เลื่อนเข้าจากขวา
  const [slideFrom, setSlideFrom] = useState("right");
  const [removingIndex, setRemovingIndex] = useState(null);
  // แถวที่กำลังยุบตัวก่อนหายจริง (ดู CollapsibleRow)
  const [leavingIndex, setLeavingIndex] = useState(null);
  const leaveHandledRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [restoredStockMap, setRestoredStockMap] = useState({});
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [priceOverrides, setPriceOverrides] = useState({});
  const restoredRef = useRef(false);
  const [_isMoreFieldsVisible, setIsMoreFieldsVisible] = useState(false);
  const [isCustomerInfoOpen, setIsCustomerInfoOpen] = useState(false);
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

      const exists = prev.some(
        (i) => i?.category?.name === "บริการ" && i?.id === 1,
      );
      if (exists) return prev;
      return [
        ...prev,
        {
          id: 1,
          name: "ค่าแรง",
          quantity: 1,
          sellingPrice: 0,
          category: { name: "บริการ" },
          side: null,
        },
      ];
    });
  }, [compatibleParts, isPartsLoaded]);

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

    if (compatibleParts.length === 0) {
      setRepairItems((prev) =>
        prev.filter(
          (item) =>
            !(
              item?.category?.name === "บริการ" &&
              (item?.id === 1 || item?.name === "ค่าแรง")
            ),
        ),
      );
    }
  }, [compatibleParts, isPartsLoaded]);

  useEffect(() => {
    if (!location.state) return;

    const {
      repairData,
      repairItems: savedItems,
      editRepairId,
      hideMoreFields,
      scrollToItems,
    } = location.state;

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
      const manualItems = savedItems.filter((i) => !i.side);
      const leftIds = savedItems
        .filter((i) => i.side === "left")
        .map((i) => i.id);
      const rightIds = savedItems
        .filter((i) => i.side === "right")
        .map((i) => i.id);
      const otherIds = savedItems
        .filter((i) => i.side === "other")
        .map((i) => i.id);

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
      if (editRepairId) {
        for (const it of savedItems) {
          if (it?.partNumber && it?.brand && typeof it.quantity === "number") {
            const key = `${it.partNumber}|${it.brand}|${it.name || ""}`;
            map[key] = (map[key] || 0) + it.quantity;
          }
        }
      }
      setRestoredStockMap(map);

      // รายการที่กู้คืนมาไม่ได้ผ่านไดอะล็อก จึงยังไม่มีเพดานของปุ่มบวกติดมาด้วย
      setRepairItems(
        manualItems.map((it) => {
          if (it.availableStock !== undefined) return it;
          const key = `${it.partNumber}|${it.brand}|${it.name || ""}`;
          return {
            ...it,
            availableStock: (it.stockQuantity || 0) + (map[key] || 0),
          };
        }),
      );
      restoredRef.current = true;
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
      ...(editRepairId ? { editRepairId } : {}),
      ...(location.state?.from ? { from: location.state.from } : {}),
      ...(location.state?.origin ? { origin: location.state.origin } : {}),
      ...(location.state?.statusSlug
        ? { statusSlug: location.state.statusSlug }
        : {}),
      ...(location.state?.vehicleId
        ? { vehicleId: location.state.vehicleId }
        : {}),
    };
    window.history.replaceState(
      preserved,
      document.title,
      window.location.pathname,
    );
  }, [location.state, setValue]);

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

      const compatible = allParts.filter((part) => {
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

      return perSide ? side === "left" || side === "right" : side === "other";
    });
  };

  const getAvailableModelsForBrand = () => {
    const selectedBrand = watch("brand");
    const modelsForBrand = vehicleModels
      .filter((item) => item.brand === selectedBrand)
      .map((item) => ({ id: item.model, name: item.model }));

    return modelsForBrand;
  };

  const renderProductInfo = (item) => {
    const isTire = item.category?.name === "ยาง";
    const isService = item.category?.name === "บริการ";

    if (isService) {
      return (
        <p className="text-normal line-clamp-1 w-full text-base leading-tight font-semibold md:text-lg">
          {item.name}
        </p>
      );
    }

    if (isTire && item.attributes && item.attributes.aspectRatio) {
      return (
        <p className="text-normal line-clamp-1 w-full text-base leading-tight font-semibold md:text-lg">
          {item.brand} {item.attributes.width}/{item.attributes.aspectRatio}R
          {item.attributes.rimDiameter} {item.name}
        </p>
      );
    }

    if (isTire && item.attributes) {
      return (
        <p className="text-normal line-clamp-1 w-full text-base leading-tight font-semibold md:text-lg">
          {item.brand} {item.attributes.width}R{item.attributes.rimDiameter}{" "}
          {item.name}
        </p>
      );
    }

    return (
      <p className="text-normal line-clamp-1 w-full text-base leading-tight font-semibold md:text-lg">
        {item.brand} {item.name}
      </p>
    );
  };

  const handleAddItemToRepair = (item) => {
    setRepairItems((prev) => {
      const itemWithSide = {
        ...item,
        side: null,
      };

      const index = prev.findIndex(
        (i) =>
          i.partNumber === itemWithSide.partNumber &&
          i.brand === itemWithSide.brand &&
          i.name === itemWithSide.name,
      );
      if (index !== -1) {
        return prev.map((i, idx) =>
          idx === index
            ? {
                ...i,
                quantity: i.quantity + 1,
              }
            : i,
        );
      } else {
        return [
          ...prev,
          {
            ...itemWithSide,
            quantity: 1,
            sellingPrice: itemWithSide.sellingPrice,
            // ราคาตั้งต้นจากคลัง ไว้เทียบตอนแก้ราคา (sellingPrice จะถูกทับเมื่อปรับราคา)
            basePrice: itemWithSide.sellingPrice,
          },
        ];
      }
    });

    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }, 200);
  };

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
    ).length;

  const getTabSelectedCountForItem = (item) => {
    const part = compatibleParts.find((p) => isSamePart(item, p));
    if (!part) return 0;
    return (
      Number(selectedLeftParts.has(part.id)) +
      Number(selectedRightParts.has(part.id)) +
      Number(selectedOtherParts.has(part.id))
    );
  };

  // เบิกได้ไม่เกินสต็อกที่มีอยู่จริง — บริการ (เช่นค่าแรง) และรายการที่พิมพ์ชื่อเองไม่มีสต็อก จึงไม่จำกัด
  // ต้องหักของชิ้นเดียวกันที่ติ๊กไว้ในแท็บออกด้วย เพราะใช้สต็อกก้อนเดียวกัน
  // (availableStock เป็นค่า ณ ตอนหยิบเข้ามา ไม่อัปเดตตามการติ๊กแท็บทีหลัง)
  const isAtStockLimit = (item) => {
    if (!item.partNumber || !item.brand) return false;
    const stock = item.availableStock ?? item.stockQuantity ?? 0;
    return item.quantity >= stock - getTabSelectedCountForItem(item);
  };

  const handleRemoveItem = () => {
    leaveHandledRef.current = false;
    setLeavingIndex(removingIndex);
    setRemovingIndex(null);
  };

  // รายการถูกวาดสองชุด (มือถือ/เดสก์ท็อป) ทั้งคู่จึงเรียกตัวนี้เมื่อยุบเสร็จ
  const handleLeaveEnd = () => {
    if (leaveHandledRef.current) return;
    leaveHandledRef.current = true;
    setRepairItems((prev) => prev.filter((_, i) => i !== leavingIndex));
    setLeavingIndex(null);
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
                sellingPrice: newPrice,
                ...(newName ? { name: newName } : {}),
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

  const getProductName = (item) => {
    if (!item) return "";
    const isTire = item.category?.name === "ยาง";
    if (isTire && item.attributes && item.attributes.aspectRatio) {
      return `${item.brand} ${item.attributes.width}/${item.attributes.aspectRatio}R${item.attributes.rimDiameter} ${item.name}`;
    }
    if (isTire && item.attributes) {
      return `${item.brand} ${item.attributes.width}R${item.attributes.rimDiameter} ${item.name}`;
    }
    // บริการไม่มียี่ห้อ (null) — ต่อสตริงตรงๆ จะได้คำว่า "null" ติดมาหน้าชื่อ
    return [item.brand, item.name].filter(Boolean).join(" ");
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
      ? Number(initialSelectedRef.current.left.has(part.id)) +
        Number(initialSelectedRef.current.right.has(part.id)) +
        Number(initialSelectedRef.current.other.has(part.id))
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
    Number(selectedLeftParts.has(part.id)) +
    Number(selectedRightParts.has(part.id)) +
    Number(selectedOtherParts.has(part.id)) +
    getExtraItemsCountForPart(part);

  // ส่งของที่ติ๊กจากแท็บให้ไดอะล็อกรู้ด้วย จะได้หักสต็อกจากก้อนเดียวกัน
  const getSelectedTabItems = () =>
    compatibleParts.flatMap((part) => {
      const count =
        Number(selectedLeftParts.has(part.id)) +
        Number(selectedRightParts.has(part.id)) +
        Number(selectedOtherParts.has(part.id));
      return count > 0 ? [{ ...part, quantity: count }] : [];
    });

  const handlePartSelection = (part, isSelected, side) => {
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

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, SUBMIT_FEEDBACK_MS));

      const allRepairItems = [
        ...Array.from(selectedLeftParts)
          .map((id) => getPartsForSide("left").find((p) => p.id === id))
          .filter(Boolean)
          .map((part) => ({
            ...part,
            sellingPrice: getPriceForPart(part),
            quantity: 1,
            side: "left",
          })),
        ...Array.from(selectedRightParts)
          .map((id) => getPartsForSide("right").find((p) => p.id === id))
          .filter(Boolean)
          .map((part) => ({
            ...part,
            sellingPrice: getPriceForPart(part),
            quantity: 1,
            side: "right",
          })),
        ...Array.from(selectedOtherParts)
          .map((id) => getPartsForSide("other").find((p) => p.id === id))
          .filter(Boolean)
          .map((part) => ({
            ...part,
            sellingPrice: getPriceForPart(part),
            quantity: 1,
            side: "other",
          })),
        ...repairItems,
      ];

      navigate("/repairs/review", {
        state: {
          repairData: { ...data, type: "SUSPENSION" },
          repairItems: allRepairItems,
          from: "suspension",
          editRepairId: location.state?.editRepairId,
          origin: location.state?.from,
          statusSlug: location.state?.statusSlug,
          vehicleId: location.state?.vehicleId,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasVehicleSelected = Boolean(watch("brand") && watch("model"));
  // รถรุ่นนี้ยังไม่ได้ผูกอะไหล่ = เช็กตามตำแหน่งไม่ได้ ต้องไปทำเป็นงานซ่อมทั่วไป
  const hasNoCompatibleParts =
    hasVehicleSelected && compatibleParts.length === 0;

  // ยกข้อมูลที่กรอกไว้ไปด้วย ไม่ต้องพิมพ์ใหม่ทั้งชุดตอนรถจอดรออยู่
  const handleSwitchToGeneralRepair = () => {
    navigate("/repairs/new", {
      state: {
        repairData: getValues(),
        repairItems,
        origin: location.state?.from,
        statusSlug: location.state?.statusSlug,
        vehicleId: location.state?.vehicleId,
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
          : `animate-in fade-in duration-200 ${
              slideFrom === "right"
                ? "slide-in-from-right-8"
                : "slide-in-from-left-8"
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
                ? "ไม่พบอะไหล่ของรถรุ่นนี้"
                : "ไม่พบอะไหล่ในตำแหน่งนี้"}
          </p>

          {hasNoCompatibleParts && (
            <button
              type="button"
              onClick={handleSwitchToGeneralRepair}
              className="border-primary text-primary bg-surface flex h-[41px] cursor-pointer items-center justify-center rounded-[20px] border px-[20px] text-lg font-semibold md:text-xl"
            >
              ทำเป็นงานซ่อมทั่วไป
            </button>
          )}
        </div>
      ) : (
        getPartsForSide(side).map((part) => {
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
                // ปกติสูงเท่าการ์ดอื่นในระบบ แต่ยอมให้ยืดได้เมื่อมีบรรทัด "สต็อกหมด" เพิ่มเข้ามา
                className={`shadow-primary flex min-h-[80px] w-full items-center justify-between gap-[8px] rounded-[10px] border-2 px-[8px] py-[8px] transition-colors duration-200 ${
                  selectedThis
                    ? "bg-primary/5 border-primary"
                    : "bg-surface border-transparent"
                } ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                  <div className="shadow-primary bg-surface flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[10px] border border-gray-200">
                    {part.secureUrl ? (
                      <img
                        src={part.secureUrl}
                        alt={part.name}
                        className="h-full w-full rounded-[10px] object-cover"
                      />
                    ) : (
                      <div className="text-subtle-light flex h-[60px] w-[60px] items-center justify-center">
                        <Image className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    {renderProductInfo(part)}
                    {/* ราคากับดินสอเป็นปุ่มเดียวกัน สูง 44px ตามขนาดขั้นต่ำของเป้ากดบนมือถือ
                        (ระยะขอบในติดลบชดเชยไม่ให้การ์ดสูงขึ้น) — กดพลาดที่นี่ = ติ๊กเลือกอะไหล่
                        โดยไม่ตั้งใจ จึงต้องกดง่ายกว่าไอคอนเปล่าๆ 20px */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCompatiblePrice(part);
                      }}
                      aria-label={`แก้ไขราคา ${part.name}`}
                      className="-my-[8px] flex h-[44px] w-fit cursor-pointer items-center gap-2 self-start"
                    >
                      <span
                        className={`text-xl leading-tight font-semibold duration-200 md:text-[22px] ${
                          selectedThis ? "text-primary" : "text-subtle-dark"
                        }`}
                      >
                        {formatCurrency(getPriceForPart(part))}
                      </span>
                      <SquarePen className="text-primary h-5 w-5 shrink-0" />
                    </button>
                    {isDisabled && (
                      <p className="text-destructive flex items-center gap-[4px] text-base leading-tight font-semibold md:text-lg">
                        <AlertTriangle className="text-destructive h-5 w-5" />
                        <span>สต็อกหมด</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* ยังไม่เลือก = วงกลมเปล่ามีเส้นขอบ / เลือกแล้ว = ทึบมีเครื่องหมายถูก
                    เป็นส่วนหนึ่งของการ์ด ไม่ใช่ปุ่มแยก เพราะกดที่ไหนในการ์ดก็เลือกได้อยู่แล้ว */}
                <div
                  className={`flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
                    selectedThis
                      ? "bg-gradient-primary text-surface border-transparent"
                      : "border-subtle-dark text-transparent"
                  }`}
                >
                  <Check className="h-[16px] w-[16px]" />
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div>
      <div className="bg-gradient-primary shadow-primary flex min-h-[100svh] flex-col xl:min-h-[calc(100vh-73px)] xl:flex-row xl:items-start xl:gap-[16px] xl:bg-transparent xl:px-[16px] xl:pt-[24px] xl:pb-[24px] xl:shadow-none">
        <div className="xl:shadow-primary flex flex-1 flex-col xl:h-fit xl:w-1/2 xl:flex-initial xl:rounded-2xl xl:bg-white">
          <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
            <div className="bg-surface/20 xl:bg-primary/10 flex h-[40px] w-[40px] items-center justify-center rounded-full">
              <CarRepair color="#ffffff" className="h-6 w-6 xl:hidden" />
              <CarRepair color="#1976d2" className="hidden h-6 w-6 xl:block" />
            </div>
            <div>
              <p className="text-surface xl:text-primary text-2xl font-semibold md:text-[26px]">
                เช็กช่วงล่าง
              </p>
            </div>
          </div>
          <form
            id="suspension-form"
            className="xl:[&_label]:text-normal xl:[&_.text-surface]:text-normal flex flex-1 flex-col"
            onSubmit={handleSubmit(onSubmit, onInvalid)}
          >
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
                    {watch("name") && (
                      <p className="text-subtle-dark line-clamp-1 text-lg md:text-xl">
                        {watch("name")}
                        {watch("phoneNumber") && ` • ${watch("phoneNumber")}`}
                      </p>
                    )}
                  </div>
                </div>
                <ChevronDown
                  className={`text-subtle-dark h-6 w-6 transition-transform duration-200 motion-reduce:transition-none ${isCustomerInfoOpen ? "rotate-180" : ""}`}
                />
              </button>
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
                    <FormInput
                      register={register}
                      name="name"
                      label="ชื่อลูกค้า"
                      type="text"
                      placeholder="เช่น สมชาย ใจดี"
                      color="subtle-dark"
                      errors={errors}
                      customClass="w-full"
                    />

                    <FormInput
                      register={register}
                      name="address"
                      label="ที่อยู่"
                      type="text"
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
            <div className="mt-[16px] px-[20px]">
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
            <div className="mt-[16px] px-[20px]">
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
            <div className="px-[20px] pt-[16px]">
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
            />

            <FormInput
              register={register}
              name="description"
              label="รายละเอียดการซ่อม"
              type="text"
              placeholder="เช่น ค้างตั้งศูนย์, รอสั่งอะไหล่"
              color="surface"
              errors={errors}
            />

            <div className="hidden pb-[24px] xl:block" />

            <div className="bg-surface shadow-primary mt-[16px] flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl xl:hidden">
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
              {/* กันการล้นตอนแผงไถลเข้ามา ไม่งั้นหน้าจะกว้างขึ้นชั่วขณะแล้วจัดตำแหน่งใหม่ทั้งหน้า */}
              <div className="overflow-x-hidden">
                {renderPartPanel(activeTab)}
              </div>
              {hasVehicleSelected && !hasNoCompatibleParts && (
                <div className="flex items-center justify-between px-[20px] pt-[16px]">
                  {/* หัวข้อย่อยใต้ "รายการซ่อมช่วงล่าง" จึงเล็กกว่าหนึ่งขั้น */}
                  <p className="text-xl font-semibold md:text-[22px]">
                    รายการซ่อมเพิ่มเติม
                  </p>
                  <AddRepairItemDialog
                    onAddItem={handleAddItemToRepair}
                    selectedItems={[...repairItems, ...getSelectedTabItems()]}
                    restoredStockMap={restoredStockMap}
                  >
                    <p className="text-primary cursor-pointer text-xl font-semibold md:text-[22px]">
                      + เพิ่มรายการซ่อม
                    </p>
                  </AddRepairItemDialog>
                </div>
              )}
              {repairItems.length === 0 && compatibleParts.length === 0 ? (
                <div className="h-[96px] lg:h-0"></div>
              ) : repairItems.length > 0 ? (
                <div className="pb-[96px] xl:pb-0">
                  {repairItems.map((item, index) => (
                    <CollapsibleRow
                      key={index}
                      leaving={leavingIndex === index}
                      onLeaveEnd={handleLeaveEnd}
                    >
                      <div className="mt-[16px] px-[20px]">
                        <div
                          role="button"
                          tabIndex={0}
                          onKeyDown={onKeyActivate(() =>
                            handlePriceClick(index, item),
                          )}
                          onClick={() => handlePriceClick(index, item)}
                          className="shadow-primary bg-surface flex h-[92px] w-full cursor-pointer items-center justify-between gap-[8px] rounded-[10px] px-[8px]"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                            <div className="shadow-primary bg-surface flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[10px] border border-gray-200">
                              {item.secureUrl ? (
                                <img
                                  src={item.secureUrl}
                                  alt={item.name}
                                  className="h-full w-full rounded-[10px] object-cover"
                                />
                              ) : (
                                <div className="text-subtle-light flex h-[60px] w-[60px] items-center justify-center">
                                  {item.partNumber && item.brand ? (
                                    <Image className="h-8 w-8" />
                                  ) : (
                                    <Wrench className="h-8 w-8" />
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col">
                              {renderProductInfo(item)}
                              <p className="text-subtle-light truncate text-base leading-tight font-medium md:text-lg">
                                {formatCurrency(Number(item.sellingPrice))}
                                {item.unit ? `/${item.unit}` : ""}
                              </p>
                              <div className="flex w-full items-center justify-between">
                                <p className="text-primary text-xl leading-tight font-semibold text-nowrap md:text-[22px]">
                                  {formatCurrency(
                                    item.quantity * item.sellingPrice,
                                  )}
                                </p>
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
                                  <p className="text-primary text-lg font-semibold md:text-xl">
                                    {item.quantity}
                                  </p>
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
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CollapsibleRow>
                  ))}
                  {compatibleParts.length > 0 && (
                    <div className="border-primary/20 from-primary/10 to-primary/5 mx-[20px] mt-[16px] mb-[16px] rounded-[10px] border bg-gradient-to-r p-[16px]">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <p className="text-subtle-dark text-xl font-semibold md:text-[22px]">
                            รวม{" "}
                            {Array.from(selectedLeftParts).filter((id) =>
                              getPartsForSide("left").some(
                                (part) => part.id === id,
                              ),
                            ).length +
                              Array.from(selectedRightParts).filter((id) =>
                                getPartsForSide("right").some(
                                  (part) => part.id === id,
                                ),
                              ).length +
                              Array.from(selectedOtherParts).filter((id) =>
                                getPartsForSide("other").some(
                                  (part) => part.id === id,
                                ),
                              ).length +
                              getRepairItemsCountExcludingLabor()}{" "}
                            รายการ
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-primary text-2xl font-semibold md:text-[26px]">
                            {formatCurrency(
                              getPartsForSide("left").reduce((total, part) => {
                                return (
                                  total +
                                  (selectedLeftParts.has(part.id)
                                    ? getPriceForPart(part)
                                    : 0)
                                );
                              }, 0) +
                                getPartsForSide("right").reduce(
                                  (total, part) => {
                                    return (
                                      total +
                                      (selectedRightParts.has(part.id)
                                        ? getPriceForPart(part)
                                        : 0)
                                    );
                                  },
                                  0,
                                ) +
                                getPartsForSide("other").reduce(
                                  (total, part) => {
                                    return (
                                      total +
                                      (selectedOtherParts.has(part.id)
                                        ? getPriceForPart(part)
                                        : 0)
                                    );
                                  },
                                  0,
                                ) +
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
                  )}
                  {compatibleParts.length > 0 && (
                    <div className="flex justify-center pb-[16px]">
                      <FormButton
                        label="ถัดไป"
                        isLoading={isLoading}
                        disabled={
                          countSelectedInTabs() + repairItems.length === 0
                        }
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="border-primary/20 from-primary/10 to-primary/5 mx-[20px] mt-[16px] mb-[16px] rounded-[10px] border bg-gradient-to-r p-[16px]">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="text-subtle-dark text-xl font-semibold md:text-[22px]">
                          รวม{" "}
                          {Array.from(selectedLeftParts).filter((id) =>
                            getPartsForSide("left").some(
                              (part) => part.id === id,
                            ),
                          ).length +
                            Array.from(selectedRightParts).filter((id) =>
                              getPartsForSide("right").some(
                                (part) => part.id === id,
                              ),
                            ).length +
                            Array.from(selectedOtherParts).filter((id) =>
                              getPartsForSide("other").some(
                                (part) => part.id === id,
                              ),
                            ).length}{" "}
                          รายการ
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-primary text-2xl font-semibold md:text-[26px]">
                          {formatCurrency(
                            getPartsForSide("left").reduce((total, part) => {
                              return (
                                total +
                                (selectedLeftParts.has(part.id)
                                  ? getPriceForPart(part)
                                  : 0)
                              );
                            }, 0) +
                              getPartsForSide("right").reduce((total, part) => {
                                return (
                                  total +
                                  (selectedRightParts.has(part.id)
                                    ? getPriceForPart(part)
                                    : 0)
                                );
                              }, 0) +
                              getPartsForSide("other").reduce((total, part) => {
                                return (
                                  total +
                                  (selectedOtherParts.has(part.id)
                                    ? getPriceForPart(part)
                                    : 0)
                                );
                              }, 0),
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center pb-[112px]">
                    <FormButton
                      label="ถัดไป"
                      isLoading={isLoading}
                      disabled={
                        countSelectedInTabs() + repairItems.length === 0
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
        <div className="hidden w-1/2 xl:block">
          <div className="bg-surface shadow-primary h-fit rounded-2xl">
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
            {/* กันการล้นตอนแผงไถลเข้ามา ไม่งั้นหน้าจะกว้างขึ้นชั่วขณะแล้วจัดตำแหน่งใหม่ทั้งหน้า */}
            <div className="overflow-x-hidden">
              {renderPartPanel(activeTab)}
            </div>
            {hasVehicleSelected && !hasNoCompatibleParts && (
              <div className="flex items-center justify-between px-[20px] pt-[16px]">
                {/* หัวข้อย่อยใต้ "รายการซ่อมช่วงล่าง" จึงเล็กกว่าหนึ่งขั้น */}
                <p className="text-xl font-semibold md:text-[22px]">
                  รายการซ่อมเพิ่มเติม
                </p>
                <AddRepairItemDialog
                  onAddItem={handleAddItemToRepair}
                  selectedItems={[...repairItems, ...getSelectedTabItems()]}
                  restoredStockMap={restoredStockMap}
                >
                  <p className="text-primary cursor-pointer text-xl font-semibold md:text-[22px]">
                    + เพิ่มรายการซ่อม
                  </p>
                </AddRepairItemDialog>
              </div>
            )}
            {repairItems.length === 0 && compatibleParts.length === 0 ? (
              <div />
            ) : repairItems.length > 0 ? (
              <div className="pb-[16px]">
                {repairItems.map((item, index) => (
                  <CollapsibleRow
                    key={index}
                    leaving={leavingIndex === index}
                    onLeaveEnd={handleLeaveEnd}
                  >
                    <div className="mt-[16px] px-[20px]">
                      <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={onKeyActivate(() =>
                          handlePriceClick(index, item),
                        )}
                        onClick={() => handlePriceClick(index, item)}
                        className="shadow-primary bg-surface flex h-[92px] w-full cursor-pointer items-center justify-between gap-[8px] rounded-[10px] px-[8px]"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                          <div className="shadow-primary bg-surface flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[10px] border border-gray-200">
                            {item.secureUrl ? (
                              <img
                                src={item.secureUrl}
                                alt={item.name}
                                className="h-full w-full rounded-[10px] object-cover"
                              />
                            ) : (
                              <div className="text-subtle-light flex h-[60px] w-[60px] items-center justify-center">
                                {item.partNumber && item.brand ? (
                                  <Image className="h-8 w-8" />
                                ) : (
                                  <Wrench className="h-8 w-8" />
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col">
                            {renderProductInfo(item)}
                            <p className="text-subtle-light truncate text-base leading-tight font-medium md:text-lg">
                              {formatCurrency(Number(item.sellingPrice))}
                              {item.unit ? `/${item.unit}` : ""}
                            </p>
                            <div className="flex w-full items-center justify-between">
                              <p className="text-primary text-xl leading-tight font-semibold text-nowrap md:text-[22px]">
                                {formatCurrency(
                                  item.quantity * item.sellingPrice,
                                )}
                              </p>
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
                                <p className="text-primary text-lg font-semibold md:text-xl">
                                  {item.quantity}
                                </p>
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
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleRow>
                ))}
                {compatibleParts.length > 0 && (
                  <div className="border-primary/20 from-primary/10 to-primary/5 mx-[20px] mt-[16px] mb-[16px] rounded-[10px] border bg-gradient-to-r p-[16px]">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="text-subtle-dark text-xl font-semibold md:text-[22px]">
                          รวม{" "}
                          {Array.from(selectedLeftParts).filter((id) =>
                            getPartsForSide("left").some(
                              (part) => part.id === id,
                            ),
                          ).length +
                            Array.from(selectedRightParts).filter((id) =>
                              getPartsForSide("right").some(
                                (part) => part.id === id,
                              ),
                            ).length +
                            Array.from(selectedOtherParts).filter((id) =>
                              getPartsForSide("other").some(
                                (part) => part.id === id,
                              ),
                            ).length +
                            getRepairItemsCountExcludingLabor()}{" "}
                          รายการ
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-primary text-2xl font-semibold md:text-[26px]">
                          {formatCurrency(
                            getPartsForSide("left").reduce((total, part) => {
                              return (
                                total +
                                (selectedLeftParts.has(part.id)
                                  ? getPriceForPart(part)
                                  : 0)
                              );
                            }, 0) +
                              getPartsForSide("right").reduce((total, part) => {
                                return (
                                  total +
                                  (selectedRightParts.has(part.id)
                                    ? getPriceForPart(part)
                                    : 0)
                                );
                              }, 0) +
                              getPartsForSide("other").reduce((total, part) => {
                                return (
                                  total +
                                  (selectedOtherParts.has(part.id)
                                    ? getPriceForPart(part)
                                    : 0)
                                );
                              }, 0) +
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
                )}
                {compatibleParts.length > 0 && (
                  <div className="flex justify-center pb-[16px]">
                    <FormButton
                      label="ถัดไป"
                      isLoading={isLoading}
                      disabled={
                        countSelectedInTabs() + repairItems.length === 0
                      }
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="border-primary/20 from-primary/10 to-primary/5 mx-[20px] mt-[16px] mb-[16px] rounded-[10px] border bg-gradient-to-r p-[16px]">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-subtle-dark text-xl font-semibold md:text-[22px]">
                        รวม{" "}
                        {Array.from(selectedLeftParts).filter((id) =>
                          getPartsForSide("left").some(
                            (part) => part.id === id,
                          ),
                        ).length +
                          Array.from(selectedRightParts).filter((id) =>
                            getPartsForSide("right").some(
                              (part) => part.id === id,
                            ),
                          ).length +
                          Array.from(selectedOtherParts).filter((id) =>
                            getPartsForSide("other").some(
                              (part) => part.id === id,
                            ),
                          ).length}{" "}
                        รายการ
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-primary text-2xl font-semibold md:text-[26px]">
                        {formatCurrency(
                          getPartsForSide("left").reduce((total, part) => {
                            return (
                              total +
                              (selectedLeftParts.has(part.id)
                                ? getPriceForPart(part)
                                : 0)
                            );
                          }, 0) +
                            getPartsForSide("right").reduce((total, part) => {
                              return (
                                total +
                                (selectedRightParts.has(part.id)
                                  ? getPriceForPart(part)
                                  : 0)
                              );
                            }, 0) +
                            getPartsForSide("other").reduce((total, part) => {
                              return (
                                total +
                                (selectedOtherParts.has(part.id)
                                  ? getPriceForPart(part)
                                  : 0)
                              );
                            }, 0),
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center pb-[16px]">
                  <FormButton
                    label="ถัดไป"
                    isLoading={isLoading}
                    form="suspension-form"
                    disabled={countSelectedInTabs() + repairItems.length === 0}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <EditPriceDialog
        isOpen={priceDialogOpen}
        onClose={() => setPriceDialogOpen(false)}
        onConfirm={handlePriceConfirm}
        currentPrice={editingItem?.sellingPrice || 0}
        originalPrice={editingItem?.basePrice}
        productName={editingItem ? getProductName(editingItem) : ""}
        productImage={editingItem?.secureUrl}
        isService={editingItem?.category?.name === "บริการ"}
        currentName={editingItem?.name || ""}
        canEditName={
          editingItem?.category?.name === "บริการ" &&
          (editingItem?.id === 1 || editingItem?.service?.id === 1)
        }
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

export default SuspensionInspection;
