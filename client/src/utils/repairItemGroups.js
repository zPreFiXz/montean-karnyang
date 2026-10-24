import { PER_SIDE_SERVICE_NAME } from "@/constants/services";
import { toUiSide } from "@/utils/repairForm";
import { isPerSide } from "@/utils/suspension";

// ยุบเฉพาะตอนแสดงผล ในฐานข้อมูลยังเป็นสองรายการแยกฝั่ง
// บรรทัดที่บันทึกแล้ว id คือเลขบรรทัด ต้องดู partId/serviceId ก่อน ไม่งั้นจับคู่ไม่ได้
const keyOf = (item) =>
  [
    item.partId ?? item.serviceId ?? item.id ?? "",
    item.partNumber ?? "",
    item.brand ?? "",
    item.itemName ?? item.name ?? "",
    item.unitPrice ?? item.sellingPrice ?? "",
  ].join("|");

// คืน { bothSides, leftOnly, rightOnly } โดยรับรายการที่แยกฝั่งมาแล้ว
export const groupBySidePairs = (leftItems = [], rightItems = []) => {
  const rightByKey = new Map();
  for (const item of rightItems) {
    const key = keyOf(item);
    if (!rightByKey.has(key)) rightByKey.set(key, []);
    rightByKey.get(key).push(item);
  }

  const bothSides = [];
  const leftOnly = [];

  for (const item of leftItems) {
    const key = keyOf(item);
    const matches = rightByKey.get(key);

    if (matches && matches.length > 0) {
      const pair = matches.shift();
      bothSides.push({
        ...item,
        quantity: (item.quantity || 0) + (pair.quantity || 0),
      });
    } else {
      leftOnly.push(item);
    }
  }

  const rightOnly = [...rightByKey.values()].flat();

  return { bothSides, leftOnly, rightOnly };
};

// side ในบิลที่บันทึกแล้วเป็นตัวใหญ่ ในหน้ากรอกเป็นตัวเล็ก จึงเทียบแบบไม่สนตัวพิมพ์
const SIDE_TEXT = { left: "L", right: "R" };

export const mergeSidesInOrder = (items = []) => {
  const sideOf = (item) => String(item.side || "").toLowerCase();
  const rows = [];
  const openLeft = new Map();
  const openRight = new Map();

  for (const item of items) {
    const side = sideOf(item);
    if (side === "both") {
      rows.push({ item, sideLabel: "L-R" });
      continue;
    }
    if (side !== "left" && side !== "right") {
      rows.push({ item, sideLabel: "" });
      continue;
    }

    const key = keyOf(item);
    const waiting = side === "left" ? openRight : openLeft;
    const pair = waiting.get(key)?.shift();
    if (pair) {
      pair.item = {
        ...pair.item,
        quantity: Number(pair.item.quantity || 0) + Number(item.quantity || 0),
      };
      pair.sideLabel = "L-R";
      continue;
    }

    const row = { item, sideLabel: SIDE_TEXT[side] };
    rows.push(row);
    const own = side === "left" ? openLeft : openRight;
    if (!own.has(key)) own.set(key, []);
    own.get(key).push(row);
  }

  return rows;
};

// ฐานข้อมูล ใบเสร็จ และหน้าเช็กช่วงล่างรู้จักแค่ซ้ายกับขวา จึงแตก "both" เป็นสองบรรทัด
export const expandBothSides = (items = []) =>
  items.flatMap((item) =>
    item.side === "both"
      ? [
          { ...item, side: "left", quantity: item.quantity / 2 },
          { ...item, side: "right", quantity: item.quantity / 2 },
        ]
      : [item],
  );

// จำนวนไม่เท่ากัน (ซ้าย 2 ขวา 1) คงเป็นสองบรรทัด เพราะรวมแล้วแบ่งกลับไม่ได้
export const collapseSidePairs = (items = []) => {
  const used = new Set();
  const rows = [];

  items.forEach((item, index) => {
    if (used.has(index)) return;
    const side = String(item.side || "").toLowerCase();
    if (side !== "left" && side !== "right") {
      rows.push(item);
      return;
    }

    const other = side === "left" ? "right" : "left";
    const partner = items.findIndex(
      (candidate, i) =>
        i !== index &&
        !used.has(i) &&
        String(candidate.side || "").toLowerCase() === other &&
        keyOf(candidate) === keyOf(item) &&
        Number(candidate.quantity) === Number(item.quantity),
    );

    if (partner === -1) {
      rows.push(item);
      return;
    }

    used.add(partner);
    rows.push({
      ...item,
      side: "both",
      quantity: Number(item.quantity) + Number(items[partner].quantity),
    });
  });

  return rows;
};

// ของที่ใส่ทั้งซ้ายและขวานับเป็นรายการเดียว ตรงกับการ์ดและใบเสร็จ
export const countDisplayedItems = (items = []) =>
  mergeSidesInOrder(items).length;

// ของที่เลือกข้างเอง (pickedSide) หรืออะไหล่หมวดอื่นที่มีข้าง อยู่ในรายการซ่อมเพิ่มเติม
export const isSuspensionTabItem = (item) =>
  !!item.side &&
  !item.pickedSide &&
  (item.side === "other" ||
    (!item.partNumber && item.name === PER_SIDE_SERVICE_NAME) ||
    item.category?.name === "ช่วงล่าง");

// บิลช่วงล่างที่บันทึกแล้ว: แยกเป็นกลุ่มซ้าย-ขวา/ซ้าย/ขวา/อื่นๆ/เพิ่มเติม ให้ตรงกับหน้าสรุปก่อนบันทึก
// บรรทัดแยกข้างที่ไม่ได้ระบุฝั่ง (บิลเก่า) แบ่งเป็นคู่ซ้ายขวา เศษสลับฝั่งกันไป
export const groupSuspensionDetailItems = (items = []) => {
  const suspensionItems = items.filter(
    (ri) => ri.part?.category?.name === "ช่วงล่าง" || ri.side,
  );
  const generalItems = items.filter(
    (ri) => ri.part?.category?.name !== "ช่วงล่าง" && !ri.side,
  );

  const leftItems = [];
  const rightItems = [];
  const otherItems = [];
  const lrGroups = {};

  suspensionItems.forEach((ri) => {
    const side = toUiSide(ri.side);
    if (side === "left") return leftItems.push(ri);
    if (side === "right") return rightItems.push(ri);
    if (side === "other") return otherItems.push(ri);

    if (isPerSide(ri.part.attributes)) {
      const key = `${ri.part.id}-${ri.unitPrice}`;
      if (!lrGroups[key]) lrGroups[key] = { base: ri, count: 0 };
      lrGroups[key].count += ri.quantity || 1;
      return;
    }
    otherItems.push(ri);
  });

  let assignLeftoverToLeft = true;
  Object.values(lrGroups).forEach(({ base, count }) => {
    for (let i = 0; i < Math.floor(count / 2); i++) {
      leftItems.push({ ...base, quantity: 1 });
      rightItems.push({ ...base, quantity: 1 });
    }
    if (count % 2 === 1) {
      (assignLeftoverToLeft ? leftItems : rightItems).push({
        ...base,
        quantity: 1,
      });
      assignLeftoverToLeft = !assignLeftoverToLeft;
    }
  });

  return {
    ...groupBySidePairs(leftItems, rightItems),
    otherItems,
    generalItems,
  };
};
