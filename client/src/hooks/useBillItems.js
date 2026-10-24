import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
import { USED_TIRE_CATEGORY, isTireCategoryName } from "@/constants/categories";
import { isPerSide } from "@/utils/suspension";
import { oilUseLineName, oilUsesOf } from "@/utils/oil";
import { getProductName, stepOf } from "@/utils/billItems";
import { toastError } from "@/utils/handleError";
import { scrollToNewRow } from "@/utils/scrollToNewRow";
import { withViewTransition } from "@/utils/viewTransition";

const isSameStockItem = (a, b) =>
  !!a.partNumber && a.partNumber === b.partNumber && a.id === b.id;

// บางหน้าวาดรายการสองชุด (มือถือ/จอใหญ่) จึงหยิบชุดที่แสดงอยู่จริง
const scrollToLastRow = () =>
  scrollToNewRow(() => {
    const rows = document.querySelectorAll("[data-repair-row]");
    const visible = [...rows].filter((el) => el.offsetParent !== null);
    return visible[visible.length - 1];
  });

// รายการซ่อมที่หน้างานซ่อมใหม่กับหน้าเช็กช่วงล่างใช้ร่วมกัน
// getReservedCount = ของชิ้นเดียวกันที่ถูกจองไว้นอกรายการนี้ (แท็บซ้าย/ขวา/อื่นๆ ของหน้าเช็กช่วงล่าง)
const useBillItems = ({ getReservedCount = () => 0 } = {}) => {
  const [repairItems, setRepairItems] = useState([]);
  const [quantityItem, setQuantityItem] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  const [isAddingFreebies, setIsAddingFreebies] = useState(false);
  const [removingIndex, setRemovingIndex] = useState(null);
  const [leavingIndex, setLeavingIndex] = useState(null);
  const leaveHandledRef = useRef(false);
  const [sidePickItem, setSidePickItem] = useState(null);
  const [oilUseItem, setOilUseItem] = useState(null);

  // ใช้รหัสอะไหล่เป็น key ไม่ได้ เพราะอะไหล่ตัวเดียวกันมีได้หลายแถว (ซ้าย-ขวา)
  // และชื่ออนิเมชันที่ซ้ำกันทำให้เบราว์เซอร์ยกเลิกอนิเมชันทั้งหน้า
  const nextRowId = useRef(0);
  // ติดธงตอนเข้าบิล ก่อนชื่อจะถูกพิมพ์ทับจนดูจากชื่อไม่ออก
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

  // availableStock มาจากไดอะล็อกเลือกอะไหล่ (คิดของที่คืนจากบิลเดิมแล้ว)
  // รายการที่กู้คืนมาจากหน้าอื่นไม่ได้ผ่านไดอะล็อก จึงใช้สต็อกที่ติดมากับอะไหล่แทน
  const stockLimitOf = (item) => item.availableStock ?? item.stockQuantity ?? 0;

  const isAtStockLimit = (item) => {
    if (!item.partNumber) return false;
    return (
      usedOfPart(item) + getReservedCount(item) + stepOf(item) >
      stockLimitOf(item)
    );
  };

  const remainingStockOf = (item) =>
    item?.partNumber
      ? Number(item.quantity ?? 0) - usedOfPart(item) - getReservedCount(item)
      : null;

  const maxQuantityOf = (item) =>
    item?.partNumber
      ? stockLimitOf(item) -
        (usedOfPart(item) - item.quantity) -
        getReservedCount(item)
      : undefined;

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
          isPartLine: isPartLikeItem(item),
          isDiscountLine: isDiscountItem(item),
          // ไดอะล็อกส่งสต็อกที่เบิกได้จริงมาทาง quantity เก็บไว้ก่อนถูกทับเป็น 1
          availableStock: item.quantity,
          quantity: side === "both" ? 2 : 1,
          side,
          // เลือกข้างเอง ไปหน้าเช็กช่วงล่างแล้วยังอยู่ในรายการซ่อมเพิ่มเติม ไม่ถูกย้ายเข้าแท็บ
          pickedSide: !!side,
          sellingPrice: item.sellingPrice,
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

  // ซ้าย-ขวาเป็นบรรทัดเดียว ตอนบันทึกค่อยแตกเป็นซ้ายหนึ่งขวาหนึ่ง (ดู expandBothSides)
  const handlePickSide = (side) => {
    const item = sidePickItem;
    setSidePickItem(null);
    if (item) addItemLine(item, side === "none" ? null : side);
  };

  // payload: ราคาอย่างเดียว หรือ { price, name } ของบรรทัดที่แก้ชื่อได้
  const updateItemPrice = (index, payload) => {
    const newPrice = typeof payload === "number" ? payload : payload?.price;
    const newName = typeof payload === "object" ? payload?.name : undefined;
    if (newPrice == null) return;

    setRepairItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              sellingPrice: isDiscountItem(item)
                ? -Math.abs(newPrice)
                : newPrice,
              // ชื่อที่พิมพ์เองต้องไม่ถูกชื่อจากคลังเขียนทับตอนบันทึก
              ...(newName && newName !== getProductName(item)
                ? { name: newName, hasCustomName: true }
                : {}),
            }
          : item,
      ),
    );
  };

  // เหลือรายการเดียวปุ่มสลับโหมดจะหายไป ถ้าไม่ปิดโหมดให้ แถวจะค้างเป็นลูกศร
  useEffect(() => {
    if (repairItems.length < 2 && isReordering) setIsReordering(false);
  }, [repairItems.length, isReordering]);

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
              // ซ้าย-ขวาต้องเป็นจำนวนคู่ เลขคี่ปัดขึ้น
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

  const handleRemoveItem = () => {
    leaveHandledRef.current = false;
    setLeavingIndex(removingIndex);
    setRemovingIndex(null);
  };

  // หน้าที่วาดรายการสองชุดเรียกตัวนี้สองครั้ง ถ้าไม่กันไว้ครั้งที่สองจะลบแถวถัดไปด้วย
  const handleLeaveEnd = () => {
    if (leaveHandledRef.current) return;
    leaveHandledRef.current = true;

    setRepairItems((prev) => prev.filter((_, i) => i !== leavingIndex));
    setLeavingIndex(null);
  };

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
  const canAddFreebies = tireCount > 0 && missingFreebies.length > 0;

  const freebieServicesRef = useRef(null);
  const loadFreebieServices = async () => {
    if (freebieServicesRef.current) return freebieServicesRef.current;
    const res = await listInventory("บริการ", null);
    freebieServicesRef.current = res.data || [];
    return freebieServicesRef.current;
  };

  // ของแถมคิดราคา 0 แต่เก็บราคาปกติไว้ ใบเสร็จจะได้บอกได้ว่าลดไปเท่าไหร่
  const buildFreebieLine = (service) =>
    withRowId({
      ...service,
      quantity: freebieQuantityFor(service.name, tireCount),
      side: null,
      isFreebie: true,
      sellingPrice: 0,
      basePrice: service.sellingPrice,
    });

  // ตั้งศูนย์ที่เพิ่มเองไว้ก่อนยางครบสี่เส้นต้องกลายเป็นของแถมด้วย
  // ยางลดลงจนไม่ถึงเกณฑ์ให้คืนราคาเดิม ไม่ลบบรรทัดทิ้งเหมือนของแถมที่ระบบเติมเอง
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

  useEffect(() => {
    if (!repairItems.some((item) => item.isFreebie)) return;

    const dropping = repairItems
      .map((item, index) => ({ item, index }))
      .filter(
        ({ item }) =>
          item.isFreebie &&
          !item.freebieFromPaid &&
          freebieQuantityFor(item.name, tireCount) === 0,
      );

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
        scrollToLastRow();
      })
      // ดึงรายชื่อบริการไม่ได้ก็แค่ไม่เติมให้ ยังกดปุ่มของแถมเองได้
      .catch(() => {});

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

  return {
    repairItems,
    setRepairItems,
    withRowId,
    itemKey,
    usedOfPart,
    isAtStockLimit,
    remainingStockOf,
    maxQuantityOf,
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
    setIsReordering,
    canAddFreebies,
    isAddingFreebies,
    handleAddFreebies,
    updateItemPrice,
  };
};

export default useBillItems;
