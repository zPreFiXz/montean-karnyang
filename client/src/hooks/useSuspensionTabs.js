import { useRef, useState } from "react";
import { PER_SIDE_SERVICE_NAME } from "@/constants/services";
import { getPartType, isPerSide } from "@/utils/suspension";

const SIDES = ["left", "right", "other"];
const emptySelection = () => ({
  left: new Set(),
  right: new Set(),
  other: new Set(),
});
const NO_SERVICE_SIDES = { left: false, right: false };

const isPerSideServiceItem = (item) =>
  !item.partNumber && item.name === PER_SIDE_SERVICE_NAME;

// ชิ้นเดียวกันในรายการซ่อมเพิ่มเติมกับในแท็บ (บรรทัดที่กู้คืนมาบางทีไม่มี id ตรงกัน จึงเทียบรหัส ยี่ห้อ ชื่อด้วย)
const isSamePart = (item, part) =>
  !!item?.partNumber &&
  (item.id === part.id ||
    (item.partNumber === part.partNumber &&
      item.brand === part.brand &&
      item.name === part.name));

// แท็บซ้าย/ขวา/อื่นๆ ของหน้าเช็กช่วงล่าง: ของที่ติ๊ก จำนวน (บูชปีกนก) ราคาเฉพาะบิล และบริการรายข้าง
// compatibleParts = อะไหล่ช่วงล่างที่ใส่รถรุ่นนี้ได้ repairItems = รายการซ่อมเพิ่มเติม (ใช้นับสต็อกร่วม)
const useSuspensionTabs = ({
  compatibleParts,
  perSideService,
  repairItems,
}) => {
  const [selected, setSelected] = useState(emptySelection);
  // จำนวนของที่ติ๊กในแท็บ เก็บเฉพาะที่มากกว่าหนึ่ง กุญแจคือ "ฝั่ง:รหัสอะไหล่" (ดู tabQty)
  const [tabQuantities, setTabQuantities] = useState({});
  const [perSideServiceSides, setPerSideServiceSides] =
    useState(NO_SERVICE_SIDES);
  const [priceOverrides, setPriceOverrides] = useState({});
  // ของที่บิลเดิมใช้ไปแล้ว ตอนแก้บิลยังเลือกได้ถึงจำนวนเดิมแม้สต็อกตอนนี้จะเหลือน้อยกว่า
  const initialRef = useRef({ selected: emptySelection(), quantities: {} });

  // อะไหล่นอกหมวดช่วงล่าง (เช่นน้ำมัน) ไม่มีข้างซ้าย-ขวา จึงอยู่ช่องอื่นๆ เหมือนของที่ไม่แยกข้าง
  // ถ้าให้เลือกได้ทุกช่องจะเผลอบันทึกว่าติดตั้งข้างซ้าย/ขวา ซึ่งไม่มีความหมายและติดไปกับบิล
  const getPartsForSide = (side) =>
    compatibleParts.filter((part) => {
      const perSide =
        part.category?.name === "ช่วงล่าง" && isPerSide(part.attributes);
      if (perSide) return side === "left" || side === "right";
      // อะไหล่ช่วงล่างที่ไม่ได้ติดตั้งแยกข้างทุกตัวไปอยู่แท็บอื่นๆ
      return side === "other";
    });

  // ชิ้นที่ติ๊กในแท็บนับเป็นหนึ่ง ยกเว้นบูชปีกนกที่ข้างหนึ่งใส่ได้หลายตัว
  const tabQty = (side, partId) =>
    selected[side].has(partId) ? tabQuantities[`${side}:${partId}`] || 1 : 0;

  const setTabQty = (side, partId, quantity) =>
    setTabQuantities((prev) => {
      const next = { ...prev };
      if (quantity > 1) next[`${side}:${partId}`] = quantity;
      else delete next[`${side}:${partId}`];
      return next;
    });

  const isPartSelected = (partId, side) => !!selected[side]?.has(partId);

  // บูชปีกนก (บน ล่าง เล็ก ใหญ่) กับสลักปีกนกล่าง ข้างหนึ่งใส่หลายตัว ที่เหลือข้างละชิ้นเดียว
  const allowsTabQuantity = (part) => {
    const type = getPartType(part?.name);
    return type.startsWith("บูชปีกนก") || type === "สลักปีกนกล่าง";
  };

  const tabCountOf = (partId) =>
    SIDES.reduce((sum, side) => sum + tabQty(side, partId), 0);

  // บริการรายข้างที่ติ๊กไว้ นับและคิดเงินรวมไปกับของในแท็บ
  const countPerSideService = () =>
    Number(!!perSideService && perSideServiceSides.left) +
    Number(!!perSideService && perSideServiceSides.right);

  const sumPerSideService = () =>
    countPerSideService() * (perSideService?.sellingPrice || 0);

  // จำนวนบรรทัดที่ติ๊กไว้ในแท็บทั้งสามฝั่ง (นับเฉพาะที่ยังอยู่ในรายการอะไหล่ที่ใช้ได้)
  const countSelectedInTabs = () =>
    SIDES.reduce(
      (sum, side) =>
        sum +
        [...selected[side]].filter((id) =>
          getPartsForSide(side).some((part) => part.id === id),
        ).length,
      0,
    ) + countPerSideService();

  const hasTabSelection =
    SIDES.some((side) => selected[side].size > 0) || countPerSideService() > 0;

  const getPriceForPart = (part) => {
    if (!part) return 0;
    const override = priceOverrides?.[part.id];
    return Number(override != null ? override : part.sellingPrice) || 0;
  };

  const setPriceOverride = (partId, price) =>
    setPriceOverrides((prev) => ({ ...prev, [partId]: price }));

  // ยอดของในแท็บ (ซ้าย/ขวา/อื่นๆ รวมบริการรายข้าง)
  const tabTotal =
    SIDES.reduce(
      (sum, side) =>
        sum +
        getPartsForSide(side).reduce(
          (total, part) =>
            total + getPriceForPart(part) * tabQty(side, part.id),
          0,
        ),
      0,
    ) + sumPerSideService();

  // ของชิ้นเดียวกันที่ติ๊กในแท็บ ใช้หักสต็อกของรายการซ่อมเพิ่มเติม
  const getTabSelectedCountForItem = (item) => {
    const part = compatibleParts.find((p) => isSamePart(item, p));
    return part ? tabCountOf(part.id) : 0;
  };

  // ของชิ้นเดียวกันอาจถูกหยิบจาก "รายการซ่อมเพิ่มเติม" ด้วย ต้องนับรวมกัน
  // ไม่งั้นสองที่จะแย่งสต็อกก้อนเดียวกันโดยไม่รู้ตัว
  const getCurrentSelectedCountForPart = (part) =>
    tabCountOf(part.id) +
    repairItems.reduce(
      (sum, item) =>
        isSamePart(item, part) ? sum + (item.quantity || 0) : sum,
      0,
    );

  const getAllowedUnitsForPart = (part) => {
    if (typeof part?.stockQuantity !== "number") return Infinity;
    const stockQty = Math.max(part.stockQuantity, 0);
    const initial = initialRef.current;
    const initialCount =
      part.category?.name === "ช่วงล่าง"
        ? SIDES.reduce(
            (sum, side) =>
              sum +
              (initial.selected[side].has(part.id)
                ? initial.quantities[`${side}:${part.id}`] || 1
                : 0),
            0,
          )
        : 0;
    return Math.max(stockQty, initialCount);
  };

  // ส่งของที่ติ๊กจากแท็บให้ไดอะล็อกเพิ่มรายการรู้ด้วย จะได้หักสต็อกจากก้อนเดียวกัน
  const getSelectedTabItems = () =>
    compatibleParts.flatMap((part) => {
      const count = tabCountOf(part.id);
      return count > 0 ? [{ ...part, quantity: count }] : [];
    });

  // อะไหล่ที่แยกซ้าย-ขวาแต่สต็อกเหลือชิ้นเดียว ติ๊กข้างหนึ่งแล้วอีกข้างหลุดเอง
  const handlePartSelection = (part, isSelected, side) => {
    if (!isSelected) setTabQty(side, part.id, 1);
    const otherSide = { left: "right", right: "left" }[side];
    const dropOtherSide =
      isSelected &&
      otherSide &&
      isPerSide(part?.attributes) &&
      getAllowedUnitsForPart(part) === 1;

    setSelected((prev) => {
      const next = { ...prev, [side]: new Set(prev[side]) };
      if (isSelected) next[side].add(part.id);
      else next[side].delete(part.id);
      if (dropOtherSide) {
        next[otherSide] = new Set(prev[otherSide]);
        next[otherSide].delete(part.id);
      }
      return next;
    });
  };

  const togglePerSideService = (side) =>
    setPerSideServiceSides((prev) => ({ ...prev, [side]: !prev[side] }));

  // อะไหล่ที่ติ๊กตามตำแหน่งเก็บไว้เป็นเซ็ตของ id ต้องคลี่กลับเป็นรายการเต็มก่อน
  // ทั้งตอนส่งไปหน้าสรุปและตอนเก็บร่าง
  const buildTabItems = () => [
    ...SIDES.flatMap((side) =>
      [...selected[side]]
        .map((id) => getPartsForSide(side).find((p) => p.id === id))
        .filter(Boolean)
        .map((part) => ({
          ...part,
          sellingPrice: getPriceForPart(part),
          quantity: tabQty(side, part.id),
          side,
        })),
    ),
    ...["left", "right"]
      .filter((side) => perSideService && perSideServiceSides[side])
      .map((side) => ({
        ...perSideService,
        sellingPrice: perSideService.sellingPrice,
        quantity: 1,
        side,
      })),
  ];

  // กู้ของในแท็บจากบรรทัดของบิลเดิม ร่าง หรือหน้าสรุป
  const restoreTabs = (tabItems) => {
    setPerSideServiceSides({
      left: tabItems.some((i) => i.side === "left" && isPerSideServiceItem(i)),
      right: tabItems.some(
        (i) => i.side === "right" && isPerSideServiceItem(i),
      ),
    });

    const nextSelected = emptySelection();
    const quantities = {};
    const prices = {};
    for (const item of tabItems) {
      if (isPerSideServiceItem(item) || !SIDES.includes(item.side)) continue;
      nextSelected[item.side].add(item.id);
      // บูชปีกนกข้างหนึ่งใส่ได้หลายตัว จำนวนติดมากับบรรทัดในบิล
      if (Number(item.quantity) > 1) {
        quantities[`${item.side}:${item.id}`] = Number(item.quantity);
      }
      // ราคาที่แก้ไว้ติดมากับรายการที่กู้คืน ไม่งั้นราคาจะเด้งกลับเป็นราคาตั้งต้นทุกครั้งที่ย้อนกลับมาจากหน้าสรุป
      if (item.id != null && item.sellingPrice != null) {
        prices[item.id] = Number(item.sellingPrice);
      }
    }
    setPriceOverrides((prev) => ({ ...prev, ...prices }));
    setTabQuantities(quantities);
    setSelected(nextSelected);
    initialRef.current = { selected: nextSelected, quantities };
  };

  const clearTabs = () => {
    setSelected(emptySelection());
    setTabQuantities({});
    setPerSideServiceSides(NO_SERVICE_SIDES);
    setPriceOverrides({});
    initialRef.current = { selected: emptySelection(), quantities: {} };
  };

  return {
    getPartsForSide,
    tabQty,
    setTabQty,
    isPartSelected,
    allowsTabQuantity,
    perSideServiceSides,
    togglePerSideService,
    countPerSideService,
    countSelectedInTabs,
    hasTabSelection,
    getPriceForPart,
    setPriceOverride,
    tabTotal,
    getTabSelectedCountForItem,
    getCurrentSelectedCountForPart,
    getAllowedUnitsForPart,
    getSelectedTabItems,
    handlePartSelection,
    buildTabItems,
    restoreTabs,
    clearTabs,
  };
};

export default useSuspensionTabs;
