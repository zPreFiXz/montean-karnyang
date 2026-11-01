import {
  sortServices,
  isNoCategoryItem,
  NO_CATEGORY_ORDER,
} from "@/constants/services";
import { getPartType } from "@/utils/suspension";
import { oilSizeOf } from "@/utils/oil";
import { OIL_CATEGORY, USED_TIRE_CATEGORY } from "@/constants/categories";

export const ALL_CATEGORIES = "ทั้งหมด";
export const NO_CATEGORY_GROUP = "ไม่มีหมวดหมู่";

// น้ำมันเรียงตามขนาดเล็กไปใหญ่ ตัวที่ไม่มีขนาดในชื่อแยกตามชนิดต่อท้าย
const OIL_TYPE_ORDER = [
  "แหวนรองน็อต",
  "โอริงรองน็อต",
  "น้ำกลั่น",
  "น้ำมันเกียร์",
  "น้ำมันเบรก",
  "น้ำมันพาวเวอร์",
  "น้ำยาหม้อน้ำ",
];
export const oilGroupOf = (item) =>
  oilSizeOf(item) ||
  OIL_TYPE_ORDER.find((type) => item.name?.startsWith(type)) ||
  "อื่นๆ";
const oilGroupRank = (item) => {
  const size = parseFloat(oilSizeOf(item));
  if (size) return size;
  const i = OIL_TYPE_ORDER.indexOf(oilGroupOf(item));
  return 1e6 + (i === -1 ? OIL_TYPE_ORDER.length : i);
};
const byOilSize = (items) =>
  [...items].sort((a, b) => oilGroupRank(a) - oilGroupRank(b));

export const oilGroupOptions = (parts) => [
  ...new Set(
    byOilSize(parts.filter((p) => p?.category?.name === OIL_CATEGORY)).map(
      oilGroupOf,
    ),
  ),
];

const NO_BRAND_GROUP = "ไม่ระบุยี่ห้อ";
const tireBrandOf = (item) => String(item.brand || "").trim() || NO_BRAND_GROUP;
const byTireBrand = (items) =>
  [...items].sort((a, b) => {
    const brandA = tireBrandOf(a);
    const brandB = tireBrandOf(b);
    if (brandA === brandB) return 0;
    if (brandA === NO_BRAND_GROUP) return 1;
    if (brandB === NO_BRAND_GROUP) return -1;
    return brandA.localeCompare(brandB, "th");
  });

// ยางในไม่มีช่องขอบ จึงอ่านจากขนาดในชื่อ (ยางใน 750-16 = ขอบ 16)
const NO_RIM_GROUP = "ไม่ระบุขอบ";
const rimOf = (item) =>
  parseFloat(item.attributes?.rimDiameter) ||
  parseFloat(String(item.name || "").match(/\d-(\d+(?:\.\d+)?)/)?.[1]) ||
  Infinity;
const rimGroupOf = (item) =>
  rimOf(item) === Infinity ? NO_RIM_GROUP : `ขอบ ${rimOf(item)}`;
const byRim = (items) => [...items].sort((a, b) => rimOf(a) - rimOf(b));

// หมวดที่แบ่งหัวข้อตามประเภท เรียงตามตัวอักษรทั้งหัวข้อและรายการ (ชื่อที่เห็นบนการ์ด = ยี่ห้อ + ชื่อ)
// หน้าเช็กช่วงล่างยังเรียงหัวข้อตามลำดับที่ช่างไล่ตรวจ (compareSuspensionTypes ใน suspension.js)
const nameCollator = new Intl.Collator("th", { numeric: true });
export const compareTypeNames = (a, b) =>
  nameCollator.compare(a || "", b || "");
const shownName = (item) => `${item.brand || ""} ${item.name || ""}`.trim();
const byTypeThenName = (typeOf) => (items) =>
  [...items].sort(
    (a, b) =>
      compareTypeNames(typeOf(a), typeOf(b)) ||
      nameCollator.compare(shownName(a), shownName(b)),
  );
const suspensionTypeOf = (item) => getPartType(item.name);

// หมวดที่ไม่มีกฎเฉพาะ ประเภทคือคำไทยที่ขึ้นต้นชื่อ ตัดรุ่นที่พิมพ์ติดกันออก (หลอดไฟP20D = หลอดไฟ)
// เพิ่มอะไหล่ประเภทใหม่ก็ได้หัวข้อใหม่เอง ชื่อบางตัวสะกด "เบรค" จึงแปลงเป็น "เบรก" ก่อน
const autoTypeOf = (item) => {
  const firstWord = getPartType(item.name).replace(/เบรค/g, "เบรก");
  return firstWord.match(/^[\u0E00-\u0E7F]+/)?.[0] || firstWord;
};
const AUTO_RULE = {
  sort: byTypeThenName(autoTypeOf),
  groupOf: autoTypeOf,
  typeFilter: true,
  sortInAll: true,
  hideSingleGroup: true,
};

// sort = ลำดับในหมวด, groupOf = หัวข้อย่อย, sortInAll = ใช้ลำดับนี้ตอนดูทั้งหมดด้วย
const CATEGORY_RULES = {
  บริการ: { sort: sortServices, sortInAll: true },
  ช่วงล่าง: {
    sort: byTypeThenName(suspensionTypeOf),
    groupOf: suspensionTypeOf,
    typeFilter: true,
    sortInAll: true,
  },
  [OIL_CATEGORY]: { sort: byOilSize, groupOf: oilGroupOf, sortInAll: true },
  ยาง: { sort: byTireBrand, groupOf: tireBrandOf },
  [USED_TIRE_CATEGORY]: { sort: byRim, groupOf: rimGroupOf },
  ยางใน: { sort: byRim, groupOf: rimGroupOf },
};

const ruleOf = (category) =>
  category === ALL_CATEGORIES ? null : (CATEGORY_RULES[category] ?? AUTO_RULE);

const groupBy = (items, keyOf) => {
  const groups = new Map();
  for (const item of items) {
    const key = keyOf(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.entries()].map(([name, items]) => ({ name, items }));
};

// "อะไหล่อื่นๆ" กับ "ส่วนลด" เป็นบรรทัดเปล่าไว้ใส่ในบิล ไม่อยู่ในหมวดไหน โผล่เฉพาะตอนดูทั้งหมด
// หมวดที่มีตัวกรองประเภทในหน้าสต็อก ประเภทคือหัวข้อย่อยของหมวดนั้น
export const hasTypeFilter = (category) => !!ruleOf(category)?.typeFilter;
export const typeOf = (category, item) =>
  ruleOf(category)?.groupOf?.(item) ?? "";

export const sortForCategory = (category, items) =>
  (ruleOf(category)?.sort ?? ((list) => list))(items).filter(
    (item) => category === ALL_CATEGORIES || !isNoCategoryItem(item),
  );

// ทั้งหมด = แยกตามหมวด เรียงตามแถบหมวดหมู่ กลุ่มไม่มีหมวดหมู่อยู่เหนือบริการ
// คืน null เมื่อหมวดนั้นไม่มีหัวข้อย่อย
export const groupInventory = (category, items, categoryOrder = []) => {
  const rule = ruleOf(category);
  if (rule?.groupOf) {
    const groups = groupBy(items, rule.groupOf);
    // หัวข้อเดียวซ้ำกับชื่อหมวด (ใบปัดน้ำฝน) จึงไม่ต้องแสดง
    return rule.hideSingleGroup && groups.length < 2 ? null : groups;
  }
  if (category !== ALL_CATEGORIES) return null;

  const rank = (name) => {
    if (name === NO_CATEGORY_GROUP) return rank("บริการ") - 0.5;
    const i = categoryOrder.indexOf(name);
    return i === -1 ? categoryOrder.length : i;
  };
  const sortGroup = (name, list) => {
    if (name === NO_CATEGORY_GROUP) {
      return [...list].sort(
        (a, b) =>
          NO_CATEGORY_ORDER.indexOf(a.name) - NO_CATEGORY_ORDER.indexOf(b.name),
      );
    }
    const rule = ruleOf(name);
    return rule?.sortInAll ? rule.sort(list) : list;
  };

  return groupBy(items, (item) =>
    isNoCategoryItem(item) ? NO_CATEGORY_GROUP : item.category?.name || "อื่นๆ",
  )
    .map(({ name, items: list }) => ({ name, items: sortGroup(name, list) }))
    .sort((a, b) => rank(a.name) - rank(b.name));
};

// ขนาดยางระบบนิ้ว (6.50, 7.00) เจอไม่บ่อย จึงดันไว้ท้าย ไม่แทรกกลางขนาดที่ใช้ประจำ
const isDecimalSize = (value) => /^\d+\.\d+$/.test(value);
export const uniqSorted = (arr = []) =>
  Array.from(new Set(arr)).sort((a, b) => {
    const decimalDiff = isDecimalSize(a) - isDecimalSize(b);
    if (decimalDiff !== 0) return decimalDiff;
    return a.localeCompare(b, undefined, { numeric: true });
  });
