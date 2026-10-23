import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Gift,
  Minus,
  Plus,
  TicketPercent,
  Trash2,
  Wrench,
} from "lucide-react";
import CollapsibleRow from "@/components/ui/CollapsibleRow";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import EditQuantityDialog from "@/components/dialogs/EditQuantityDialog";
import OilUsePickDialog from "@/components/dialogs/OilUsePickDialog";
import SidePickDialog from "@/components/dialogs/SidePickDialog";
import { SparePart } from "@/components/icons/Icons";
import { onKeyActivate } from "@/utils/a11y";
import { formatCurrency, formatQuantity } from "@/utils/formats";
import { listInventory } from "@/api/inventory";
import {
  ALIGNMENT_FREE_TIRE_COUNT,
  TIRE_ALIGNMENT_FREEBIE_NAME,
  TIRE_FREEBIE_NAMES,
  freebieQuantityFor,
  hasTypedUnit,
  isDiscountItem,
  isPartLikeItem,
  isSingleQuantityItem,
} from "@/constants/services";
import {
  USED_TIRE_CATEGORY,
  allowsDecimalQuantity,
  isTireCategoryName,
} from "@/constants/categories";
import { isPerSide } from "@/utils/suspension";
import { oilUseLineName, oilUsesOf } from "@/utils/oil";
import { formatProductName } from "@/utils/tireSize";
import { toastError } from "@/utils/handleError";
import { scrollToNewRow } from "@/utils/scrollToNewRow";
import { withViewTransition } from "@/utils/viewTransition";

// ตัวย่อเดียวกับที่ใบเสร็จเขียน (L) (R) (L-R)
const SIDE_LABELS = { left: "L", right: "R", both: "L-R" };

// บริการไม่มียี่ห้อ (null) ต่อสตริงตรงๆ จะได้คำว่า "null" ติดมาหน้าชื่อ
// ชื่อที่พิมพ์ทับไว้เองคือทั้งบรรทัดแล้ว ไม่ต้องเติมยี่ห้อกับขนาดยางนำหน้าอีก
export const getProductName = (item) => {
  if (!item) return "";
  if (item.hasCustomName) return item.name;

  return formatProductName({
    brand: item.brand,
    name: item.name,
    attributes: item.attributes,
    isTire: isTireCategoryName(item.category?.name),
    isUsedTire: item.category?.name === USED_TIRE_CATEGORY,
  });
};

export const renderProductInfo = (item) => (
  <p className="text-normal line-clamp-1 w-full text-base leading-tight font-semibold md:text-lg">
    {getProductName(item)}
  </p>
);

// ป้ายฝั่งทับมุมซ้ายบนของรูป จุดที่ตามองก่อน และไม่กินที่ของชื่อกับราคา
// การ์ดซ้ายกับขวาของชิ้นเดียวกันหน้าตาเหมือนกันทุกอย่าง ป้ายนี้จึงต้องเห็นชัดตั้งแต่กวาดตา
export const renderSideBadge = (item) =>
  SIDE_LABELS[item.side] ? (
    <span className="bg-primary text-surface absolute -top-[6px] -left-[6px] z-10 rounded-[6px] px-[6px] text-sm leading-[20px] font-semibold shadow-sm md:text-base">
      {SIDE_LABELS[item.side]}
    </span>
  ) : null;

// บรรทัดทั้งสองข้างเพิ่มลดทีละคู่ จำนวนนับเป็นชิ้นรวม (2 4 6) ให้ราคารวมคิดตรงๆ ได้เหมือนบรรทัดอื่น
export const stepOf = (item) => (item.side === "both" ? 2 : 1);

// อะไหล่ตัวเดียวกันทุกบรรทัดในบิล (ซ้ายกับขวาเป็นคนละบรรทัด) ใช้คิดเพดานสต็อกรวม
const isSameStockItem = (a, b) =>
  !!a.partNumber && a.partNumber === b.partNumber && a.id === b.id;

// พาไปหาแถวที่เพิ่งเพิ่ม แทนการกระโดดลงล่างสุดของหน้า
// บางหน้าวาดรายการสองชุด (มือถือ/จอใหญ่) จึงหยิบชุดที่แสดงอยู่จริง
const scrollToLastRow = () =>
  scrollToNewRow(() => {
    const rows = document.querySelectorAll("[data-repair-row]");
    const visible = [...rows].filter((el) => el.offsetParent !== null);
    return visible[visible.length - 1];
  });

// รายการซ่อมของหน้ากรอกบิลกับหน้าเช็กช่วงล่างใช้ตรรกะชุดเดียวกัน
// (เพิ่ม ลด ย้าย ลบ เลือกข้าง เลือกงานน้ำมัน ของแถมยาง) แก้ที่นี่ที่เดียวทั้งสองหน้าตามกัน
//
// getReservedCount = ของชิ้นเดียวกันที่ถูกจองไว้นอกรายการนี้ ใช้สต็อกกองเดียวกัน
// (หน้าเช็กช่วงล่างคือของที่ติ๊กในแท็บซ้าย/ขวา/อื่นๆ)
const useBillItems = ({
  getReservedCount = () => 0,
  reorderLabel = "จัดเรียงรายการซ่อม",
} = {}) => {
  const [repairItems, setRepairItems] = useState([]);
  const [quantityItem, setQuantityItem] = useState(null);
  // โหมดจัดเรียง แถวเปลี่ยนปุ่มลบ/เพิ่มจำนวนเป็นลูกศรขึ้นลง
  // ไม่โชว์ลูกศรค้างไว้ตลอด เพราะแถวมีปุ่มแน่นอยู่แล้วบนจอมือถือ
  const [isReordering, setIsReordering] = useState(false);
  const [isAddingFreebies, setIsAddingFreebies] = useState(false);
  const [removingIndex, setRemovingIndex] = useState(null);
  // แถวที่กำลังยุบตัวก่อนหายจริง (ดู CollapsibleRow)
  const [leavingIndex, setLeavingIndex] = useState(null);
  const leaveHandledRef = useRef(false);
  // อะไหล่หรือบริการที่ตั้งว่าแยกซ้าย-ขวา ถามฝั่งก่อนลงบิล
  const [sidePickItem, setSidePickItem] = useState(null);
  // น้ำมันที่ใช้ได้หลายงานถามก่อนว่าใช้เติมอะไร (ดู oilUsesOf)
  const [oilUseItem, setOilUseItem] = useState(null);

  // แจกรหัสประจำแถวตอนของเข้ามาในบิล ใช้เป็น key ของ React และชื่อสำหรับอนิเมชันสลับที่
  // ต้องแจกเอง ไม่ใช้รหัสอะไหล่ เพราะบิลมีอะไหล่ตัวเดียวกันได้หลายแถว (ซ้าย-ขวา)
  // ชื่อซ้ำกันแม้แถวเดียวก็ทำให้เบราว์เซอร์ยกเลิกอนิเมชันทั้งหน้า
  const nextRowId = useRef(0);
  // ติดธงงานครั้งเดียวตอนเข้าบิล ก่อนชื่อจะถูกพิมพ์ทับจนดูจากชื่อไม่ออก
  const withRowId = (item) => ({
    ...item,
    rowId: item.rowId || `row-${++nextRowId.current}`,
    isSingleLine: isSingleQuantityItem(item),
    isTypedUnitLine: hasTypedUnit(item),
  });
  const itemKey = (item) => item.rowId;

  const usedOfPart = (item, lines = repairItems) =>
    lines
      .filter((line) => isSameStockItem(line, item))
      .reduce((sum, line) => sum + Number(line.quantity || 0), 0);

  // เบิกได้ไม่เกินสต็อกที่มีอยู่จริง ไม่เกี่ยวกับสต็อกขั้นต่ำ
  // availableStock มาจากไดอะล็อกเลือกอะไหล่ (คิดของที่คืนจากบิลเดิมแล้ว) ส่วนรายการที่กู้คืน
  // กลับมาจากหน้าอื่นไม่ได้ผ่านไดอะล็อก จึงถอยไปใช้สต็อกที่ติดมากับตัวอะไหล่
  // บริการและรายการที่พิมพ์ชื่อเองไม่มีสต็อก จึงไม่จำกัด
  const stockLimitOf = (item) => item.availableStock ?? item.stockQuantity ?? 0;

  const isAtStockLimit = (item) => {
    if (!item.partNumber) return false;
    return (
      usedOfPart(item) + getReservedCount(item) + stepOf(item) >
      stockLimitOf(item)
    );
  };

  const addItemLine = (item, side = null) => {
    setRepairItems((prev) => {
      const index = prev.findIndex(
        (i) =>
          i.partNumber === item.partNumber &&
          i.brand === item.brand &&
          i.name === item.name &&
          (i.side || null) === side,
      );
      if (index !== -1) {
        return prev.map((i, idx) => {
          if (idx !== index || isSingleQuantityItem(i)) return i;

          // เลือกซ้ำจากไดอะล็อกไม่ได้ผ่านปุ่มบวก จึงต้องกันเพดานตรงนี้ด้วย
          const step = stepOf(i);
          const canAdd =
            !i.partNumber ||
            usedOfPart(i, prev) + getReservedCount(i) + step <= stockLimitOf(i);

          return { ...i, quantity: canAdd ? i.quantity + step : i.quantity };
        });
      }
      return [
        ...prev,
        withRowId({
          ...item,
          // จำไว้ว่าบรรทัดนี้เป็นอะไหล่ที่ซื้อมาใช้เลย ชื่อจะถูกพิมพ์ทับทีหลัง
          isPartLine: isPartLikeItem(item),
          // บรรทัดส่วนลดเก็บราคาติดลบ ยอดรวมจึงหักออกให้เอง
          isDiscountLine: isDiscountItem(item),
          // ไดอะล็อกส่งสต็อกที่เบิกได้จริงมาทาง quantity (คิดสต็อกที่คืนจากบิลเดิมแล้ว)
          // เก็บไว้ก่อนถูกทับเป็น 1 เพื่อใช้เป็นเพดานของปุ่มบวก
          availableStock: item.quantity,
          quantity: side === "both" ? 2 : 1,
          side,
          // เลือกข้างเอง ไปหน้าเช็กช่วงล่างแล้วยังอยู่ในรายการซ่อมเพิ่มเติม ไม่ถูกย้ายเข้าแท็บซ้าย/ขวา
          pickedSide: !!side,
          sellingPrice: item.sellingPrice,
          // ราคาตั้งต้นจากคลัง ไว้เทียบตอนแก้ราคา (sellingPrice จะถูกทับเมื่อปรับราคา)
          basePrice: item.sellingPrice,
        }),
      ];
    });

    scrollToLastRow();
  };

  const handleAddItemToRepair = (item) => {
    if (oilUsesOf(item).length > 0) {
      setOilUseItem(item);
      return;
    }
    if (isPerSide(item.attributes)) {
      setSidePickItem(item);
      return;
    }
    addItemLine(item);
  };

  // ชื่อที่ได้คือชื่อเต็มของบรรทัดแล้ว ไม่ต้องให้การ์ดเติมยี่ห้อซ้ำ ตอนบันทึกส่งชื่อนี้ไปเป็นชื่อในบิล
  // งานต่างกันชื่อต่างกัน จึงแยกเป็นคนละบรรทัด แต่ยังนับสต็อกกองเดียวกัน
  const handlePickOilUse = (use) => {
    const item = oilUseItem;
    setOilUseItem(null);
    if (!item) return;
    addItemLine({
      ...item,
      name: oilUseLineName(item, use),
      hasCustomName: true,
    });
  };

  // ทั้งสองข้าง = บรรทัดเดียว ป้าย L-R จำนวนเริ่มที่ 2 ชิ้น
  // ตอนบันทึกค่อยแตกเป็นซ้ายหนึ่งขวาหนึ่ง (ดู expandBothSides) ใบเสร็จจะรวมกลับเป็น (L-R) ให้เอง
  const handlePickSide = (side) => {
    const item = sidePickItem;
    setSidePickItem(null);
    if (item) addItemLine(item, side === "none" ? null : side);
  };

  // ผลจากหน้าต่างแก้ราคา: ราคาอย่างเดียว หรือ { price, name } ของบรรทัดที่แก้ชื่อได้
  const updateItemPrice = (index, payload) => {
    const newPrice = typeof payload === "number" ? payload : payload?.price;
    const newName = typeof payload === "object" ? payload?.name : undefined;
    if (newPrice == null) return;

    setRepairItems((prev) =>
      prev.map((item, i) =>
        i === index
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
        i === quantityItem.index
          ? {
              ...item,
              // ทั้งสองข้างต้องเป็นจำนวนคู่ พิมพ์เลขคี่มาปัดขึ้นเป็นคู่ถัดไป
              quantity:
                item.side === "both"
                  ? Math.max(2, Math.ceil(quantity / 2) * 2)
                  : quantity,
            }
          : item,
      ),
    );
  };

  const handleUnitChange = (index, unit) => {
    setRepairItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, unit } : item)),
    );
  };

  const handleIncreaseQuantity = (index) => {
    setRepairItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity: item.quantity + stepOf(item) }
          : item,
      ),
    );
  };

  const handleDecreaseQuantity = (index) => {
    setRepairItems((prev) =>
      prev.map((item, i) =>
        i === index && item.quantity > stepOf(item)
          ? { ...item, quantity: item.quantity - stepOf(item) }
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

  // บางหน้าวาดรายการสองชุด (มือถือ/จอใหญ่) ทั้งคู่จึงเรียกตัวนี้เมื่อยุบเสร็จ
  // ถ้าไม่กันไว้ ครั้งที่สองจะไปลบรายการถัดไปที่เลื่อนขึ้นมาแทนที่
  const handleLeaveEnd = () => {
    if (leaveHandledRef.current) return;
    leaveHandledRef.current = true;

    setRepairItems((prev) => prev.filter((_, i) => i !== leavingIndex));
    setLeavingIndex(null);
  };

  // ซื้อยางแล้วร้านแถมจุ๊บลมกับถ่วงล้อทุกเส้น ครบสี่เส้นแถมตั้งศูนย์ด้วย
  // ไม่ใส่ให้เองอัตโนมัติ เพราะบางคนเอายางไปใส่เอง ไม่ได้ถ่วงล้อที่ร้าน
  // นับเฉพาะยางใหม่ ยางเปอร์เซ็นต์ขายราคามือสองจึงไม่มีของแถม
  const tireCount = repairItems
    .filter(
      (item) =>
        isTireCategoryName(item.category?.name) &&
        item.category?.name !== USED_TIRE_CATEGORY,
    )
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const freebieNames = [
    ...TIRE_FREEBIE_NAMES,
    ...(tireCount >= ALIGNMENT_FREE_TIRE_COUNT
      ? [TIRE_ALIGNMENT_FREEBIE_NAME]
      : []),
  ];
  const missingFreebies = freebieNames.filter(
    (name) => !repairItems.some((item) => item.name === name),
  );

  // รายชื่อบริการอ่านครั้งเดียวแล้วเก็บไว้ ใช้ทั้งตอนกดปุ่มและตอนเติมตั้งศูนย์ให้เอง
  const freebieServicesRef = useRef(null);
  const loadFreebieServices = async () => {
    if (freebieServicesRef.current) return freebieServicesRef.current;
    const res = await listInventory("บริการ", null);
    freebieServicesRef.current = res.data || [];
    return freebieServicesRef.current;
  };

  const buildFreebieLine = (service) =>
    withRowId({
      ...service,
      quantity: freebieQuantityFor(service.name, tireCount),
      // ของแถมไม่ใช่งานรายข้าง จึงไม่ผูกกับซ้ายขวา
      side: null,
      // จำไว้ว่าบรรทัดนี้มาจากของแถม จะได้ขยับจำนวนตามยางให้เอง
      isFreebie: true,
      // ของแถมคิดราคา 0 แต่เก็บราคาปกติไว้ ใบเสร็จจะได้บอกได้ว่าลดไปเท่าไหร่
      sellingPrice: 0,
      basePrice: service.sellingPrice,
    });

  // ยางครบสี่เส้นเมื่อไหร่ ตั้งศูนย์ที่เพิ่มเองไว้ก่อนหน้าต้องกลายเป็นของแถมด้วย
  // ไม่งั้นคนที่เลือกตั้งศูนย์ไว้ตั้งแต่แรกจะโดนคิดเงินทั้งที่เข้าเกณฑ์แถม
  // ถ้ายางลดลงจนไม่ถึงเกณฑ์ ให้คืนราคาเดิม ไม่ใช่ลบบรรทัดทิ้งเหมือนของแถมที่ระบบเติมเอง
  useEffect(() => {
    setRepairItems((prev) => {
      let changed = false;

      const next = prev.map((item) => {
        if (item.name !== TIRE_ALIGNMENT_FREEBIE_NAME) return item;

        const shouldBeFree = tireCount >= ALIGNMENT_FREE_TIRE_COUNT;

        if (shouldBeFree && !item.isFreebie) {
          changed = true;
          return {
            ...item,
            isFreebie: true,
            freebieFromPaid: true,
            basePrice: item.sellingPrice ?? item.basePrice,
            sellingPrice: 0,
          };
        }

        if (!shouldBeFree && item.freebieFromPaid) {
          changed = true;
          return {
            ...item,
            isFreebie: false,
            freebieFromPaid: false,
            sellingPrice: item.basePrice ?? 0,
          };
        }

        return item;
      });

      return changed ? next : prev;
    });
  }, [tireCount]);

  // ยางเปลี่ยนจำนวนเมื่อไหร่ ของแถมต้องขยับตาม จุ๊บลมเท่าจำนวนยาง ถ่วงล้อไม่เกินสองล้อ
  // และตั้งศูนย์หายไปถ้ายางไม่ถึงสี่เส้น (แตะเฉพาะบรรทัดที่มาจากปุ่มของแถม)
  useEffect(() => {
    if (!repairItems.some((item) => item.isFreebie)) return;

    // ของแถมที่ไม่ควรมีแล้ว (ยางน้อยลงจนไม่ถึงเกณฑ์) ต้องหายออกไป
    const dropping = repairItems
      .map((item, index) => ({ item, index }))
      .filter(
        ({ item }) =>
          item.isFreebie &&
          // บรรทัดที่เคยเป็นของเสียเงินให้คืนราคาแทนการลบทิ้ง (อีกเอฟเฟกต์จัดการอยู่)
          !item.freebieFromPaid &&
          freebieQuantityFor(item.name, tireCount) === 0,
      );

    // ตัวแรกยุบแถวออกให้เห็นเหมือนกดลบเอง ที่เหลือ (เช่นลบยางออกหมดทีเดียว) ตัดทิ้งเลย
    const animatedIndex = dropping[0]?.index ?? -1;
    const removeNow = new Set(dropping.slice(1).map(({ index }) => index));

    setRepairItems((prev) => {
      const next = prev
        .map((item) => {
          if (!item.isFreebie) return item;
          const quantity = freebieQuantityFor(item.name, tireCount);
          return quantity === 0 || quantity === item.quantity
            ? item
            : { ...item, quantity };
        })
        .filter((_, index) => !removeNow.has(index));

      const changed =
        next.length !== prev.length || next.some((item, i) => item !== prev[i]);
      return changed ? next : prev;
    });

    if (animatedIndex !== -1 && leavingIndex === null) {
      leaveHandledRef.current = false;
      setLeavingIndex(animatedIndex);
      return;
    }

    // เพิ่มยางจนครบสี่เส้นแล้วตั้งศูนย์ต้องโผล่มาเอง ไม่ต้องกดปุ่มของแถมซ้ำ
    const needsAlignment =
      tireCount >= ALIGNMENT_FREE_TIRE_COUNT &&
      !repairItems.some((item) => item.name === TIRE_ALIGNMENT_FREEBIE_NAME);

    if (!needsAlignment) return;

    let cancelled = false;
    loadFreebieServices()
      .then((services) => {
        const alignment = services.find(
          (service) => service.name === TIRE_ALIGNMENT_FREEBIE_NAME,
        );
        if (cancelled || !alignment) return;

        setRepairItems((prev) =>
          prev.some((item) => item.name === TIRE_ALIGNMENT_FREEBIE_NAME)
            ? prev
            : [...prev, buildFreebieLine(alignment)],
        );

        // โผล่มาเองแล้วต้องพาไปดูด้วย ไม่งั้นบรรทัดใหม่จะอยู่นอกจอโดยไม่มีใครรู้
        scrollToLastRow();
      })
      .catch(() => {
        // ดึงรายชื่อบริการไม่ได้ก็แค่ไม่เติมให้ ยังกดปุ่มของแถมเองได้
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tireCount]);

  const handleAddFreebies = async () => {
    if (isAddingFreebies || missingFreebies.length === 0) return;

    try {
      setIsAddingFreebies(true);
      const services = await loadFreebieServices();

      const added = missingFreebies
        .map((name) => services.find((service) => service.name === name))
        .filter(Boolean)
        .filter((service) => freebieQuantityFor(service.name, tireCount) > 0)
        .map(buildFreebieLine);

      if (added.length === 0) {
        toast.error("ไม่พบบริการของแถมในคลัง");
        return;
      }

      setRepairItems((prev) => [...prev, ...added]);
      scrollToLastRow();
    } catch (error) {
      toastError(error);
    } finally {
      setIsAddingFreebies(false);
    }
  };

  // ปุ่มเดียวกันวางสองที่ (มือถือ/จอใหญ่) ประกาศไว้ที่เดียวจะได้ไม่หลุดกันเวลาแก้
  // ขึ้นเฉพาะบิลที่มียางและยังเพิ่มของแถมไม่ครบ
  const freebieButton = tireCount > 0 && missingFreebies.length > 0 && (
    <button
      type="button"
      onClick={handleAddFreebies}
      disabled={isAddingFreebies}
      aria-label="เพิ่มของแถม"
      title="เพิ่มของแถม"
      className="text-primary border-primary/40 bg-primary/5 flex h-[32px] w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] border duration-300 disabled:opacity-60"
    >
      <Gift className="h-4 w-4" />
    </button>
  );

  // โผล่เมื่อมีของตั้งแต่สองรายการ เพราะมีชิ้นเดียวไม่มีอะไรให้สลับ
  const reorderButton = repairItems.length > 1 && (
    <button
      type="button"
      onClick={() => setIsReordering((prev) => !prev)}
      aria-pressed={isReordering}
      aria-label={isReordering ? "ออกจากโหมดจัดเรียง" : reorderLabel}
      className={`flex h-[32px] w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] border duration-300 ${
        isReordering
          ? "bg-primary border-primary text-surface"
          : "text-subtle-dark border-gray-200 bg-gray-100"
      }`}
    >
      <ArrowUpDown className="h-4 w-4" />
    </button>
  );

  // แถวรายการซ่อม หน้ากรอกบิลกับหน้าเช็กช่วงล่างหน้าตาเหมือนกัน
  // onRowClick = กดแถวแล้วเปิดหน้าต่างแก้ราคา (แต่ละหน้าจัดการหน้าต่างเอง)
  // transitionPrefix = ชื่อนำหน้าของอนิเมชันสลับที่ ต้องไม่ซ้ำกับชื่อในส่วนอื่นของหน้า
  const renderItemRows = ({ onRowClick, transitionPrefix }) =>
    repairItems.map((item, index) => (
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
            viewTransitionName: `${transitionPrefix}-${itemKey(item)}`,
          }}
          className="mt-[16px] px-[20px]"
        >
          <div
            role="button"
            tabIndex={0}
            onKeyDown={onKeyActivate(() => {
              if (isReordering) return;
              onRowClick(index, item);
            })}
            // โหมดจัดเรียงตั้งใจให้กดลูกศรอย่างเดียว กดโดนแถวแล้วเด้งหน้าต่างแก้ราคาจะกวน
            onClick={() => {
              if (isReordering) return;
              onRowClick(index, item);
            }}
            className="shadow-primary bg-surface relative flex h-[92px] w-full cursor-pointer items-center justify-between gap-[8px] rounded-[10px] px-[8px]"
          >
            <div className="flex min-w-0 flex-1 items-center gap-[8px]">
              <div className="shadow-primary bg-surface relative flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[10px] border border-gray-200">
                {renderSideBadge(item)}
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
                    {isDiscountItem(item) ? (
                      <TicketPercent className="h-9 w-9" />
                    ) : !item.partNumber && !isPartLikeItem(item) ? (
                      <Wrench className="h-9 w-9" />
                    ) : (
                      <SparePart className="h-10 w-10" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                {renderProductInfo(item)}
                {/* ส่วนลดมีบรรทัดเดียวและจำนวนเป็นหนึ่งเสมอ ราคาต่อหน่วยจึงซ้ำกับยอดรวม */}
                {!isDiscountItem(item) && !isSingleQuantityItem(item) && (
                  <p className="text-subtle-light truncate text-base leading-tight font-medium md:text-lg">
                    {/* บริการที่ไม่ได้ตั้งหน่วยไว้เหลือแค่ราคา */}
                    {formatCurrency(Number(item.sellingPrice))}
                    {item.unit ? `/${item.unit}` : ""}
                  </p>
                )}
                <div className="flex w-full items-center justify-between">
                  <p className="text-primary min-w-0 truncate text-xl leading-tight font-semibold text-nowrap md:text-[22px]">
                    {formatCurrency(item.quantity * item.sellingPrice)}
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
                  ) : isDiscountItem(item) || isSingleQuantityItem(item) ? (
                    // ส่วนลดกับงานที่คิดครั้งเดียวต่อคัน ไม่มีจำนวนให้เพิ่มลด เหลือไว้แค่ปุ่มลบ
                    // วางลอยกลางการ์ดในแนวตั้ง ไม่ให้ไปเกาะบรรทัดราคาเหมือนปุ่มจำนวน
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRemovingIndex(index);
                      }}
                      aria-label="เอารายการออก"
                      className="bg-destructive text-surface absolute top-1/2 right-[8px] flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[8px]"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  ) : (
                    <div
                      className="flex shrink-0 items-center gap-[4px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.quantity <= stepOf(item)) {
                            setRemovingIndex(index);
                            return;
                          }
                          handleDecreaseQuantity(index);
                        }}
                        aria-label={
                          item.quantity <= stepOf(item)
                            ? "เอารายการออก"
                            : "ลดจำนวน"
                        }
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100"
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
                        className="text-primary min-w-[28px] cursor-pointer text-lg font-semibold md:text-xl"
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
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100 disabled:bg-gray-50 disabled:text-gray-300"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      {/* อะไหล่อื่นๆ กับบริการอื่นๆ ไม่มีหน่วยในคลัง ช่างพิมพ์เองต่อท้ายจำนวน อ่านได้ว่า "2 ตัว" */}
                      {hasTypedUnit(item) && (
                        <input
                          type="text"
                          value={item.unit || ""}
                          onChange={(e) =>
                            handleUnitChange(index, e.target.value)
                          }
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter") e.currentTarget.blur();
                          }}
                          maxLength={20}
                          placeholder="หน่วย"
                          aria-label={`หน่วยของ ${getProductName(item)}`}
                          className="text-subtle-dark placeholder:text-subtle-light bg-surface focus:border-primary ml-[4px] h-9 w-[44px] shrink-0 rounded-[8px] border border-gray-200 px-[4px] text-center text-base font-medium outline-none md:text-lg"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleRow>
    ));

  // หน้าต่างที่ผูกกับรายการซ่อม (เลือกงานน้ำมัน เลือกข้าง แก้จำนวน ยืนยันเอาออก) ใช้ทั้งสองหน้า
  // เพดานจำนวนหักของชิ้นเดียวกันในบรรทัดอื่นและของที่จองไว้นอกรายการ (แท็บช่วงล่าง) ออก
  // บริการไม่มีสต็อก จึงไม่จำกัดจำนวน
  // วาดตอนหน้าเรียกใน JSX ไม่ใช่ตอนเรียก hook เพราะ getReservedCount ของหน้าเช็กช่วงล่าง
  // อ้างถึงฟังก์ชันที่ประกาศทีหลังในหน้านั้น เรียกระหว่างเรียก hook จะเจอ "ใช้ก่อนประกาศ"
  const renderItemDialogs = () => (
    <>
      <OilUsePickDialog
        isOpen={!!oilUseItem}
        onClose={() => setOilUseItem(null)}
        onPick={handlePickOilUse}
        itemName={oilUseItem ? getProductName(oilUseItem) : ""}
        uses={oilUseItem ? oilUsesOf(oilUseItem) : []}
      />
      <SidePickDialog
        isOpen={!!sidePickItem}
        onClose={() => setSidePickItem(null)}
        onPick={handlePickSide}
        itemName={sidePickItem ? getProductName(sidePickItem) : ""}
        remaining={
          sidePickItem?.partNumber
            ? Number(sidePickItem.quantity ?? 0) -
              usedOfPart(sidePickItem) -
              getReservedCount(sidePickItem)
            : null
        }
      />
      <EditQuantityDialog
        isOpen={!!quantityItem}
        onClose={() => setQuantityItem(null)}
        onConfirm={handleSetQuantity}
        currentQuantity={quantityItem?.item?.quantity ?? 1}
        productName={quantityItem ? getProductName(quantityItem.item) : ""}
        unit={quantityItem?.item?.unit || ""}
        maxQuantity={
          quantityItem?.item?.partNumber
            ? stockLimitOf(quantityItem.item) -
              (usedOfPart(quantityItem.item) - quantityItem.item.quantity) -
              getReservedCount(quantityItem.item)
            : undefined
        }
        allowDecimal={allowsDecimalQuantity(quantityItem?.item)}
      />
      <ConfirmDialog
        isOpen={removingIndex !== null}
        onClose={() => setRemovingIndex(null)}
        onConfirm={handleRemoveItem}
        title="ยืนยันการเอารายการออก"
        // ยังไม่ได้บันทึกลงระบบ กดผิดก็กรอกใหม่ได้ ไม่ต้องกดค้าง
        requireHold={false}
        itemName={
          removingIndex !== null && repairItems[removingIndex]
            ? getProductName(repairItems[removingIndex])
            : ""
        }
      />
    </>
  );

  return {
    repairItems,
    setRepairItems,
    withRowId,
    itemKey,
    usedOfPart,
    isAtStockLimit,
    addItemLine,
    handleAddItemToRepair,
    oilUseItem,
    setOilUseItem,
    handlePickOilUse,
    sidePickItem,
    setSidePickItem,
    handlePickSide,
    quantityItem,
    setQuantityItem,
    handleSetQuantity,
    handleUnitChange,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    handleMoveItem,
    removingIndex,
    setRemovingIndex,
    leavingIndex,
    handleRemoveItem,
    handleLeaveEnd,
    isReordering,
    reorderButton,
    freebieButton,
    renderItemRows,
    renderItemDialogs,
    updateItemPrice,
  };
};

export default useBillItems;
