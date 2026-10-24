import {
  sortServices,
  isNoCategoryItem,
  NO_CATEGORY_ORDER,
} from "@/constants/services";
import { compareSuspensionTypes, getPartType } from "@/utils/suspension";
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

// แบ่งหัวข้อตามคำขึ้นต้นของชื่อ ชื่อบางตัวสะกด "เบรค" จึงเทียบหลังแปลงเป็น "เบรก"
const byPrefix = (order) => {
  const groupOf = (item) => {
    const name = (item.name || "").replace(/เบรค/g, "เบรก");
    return order.find((type) => name.startsWith(type)) || "อื่นๆ";
  };
  const rank = (item) => {
    const i = order.indexOf(groupOf(item));
    return i === -1 ? order.length : i;
  };
  return {
    sort: (items) => [...items].sort((a, b) => rank(a) - rank(b)),
    groupOf,
  };
};

const bySuspensionType = (items) =>
  [...items].sort((a, b) =>
    compareSuspensionTypes(getPartType(a.name), getPartType(b.name)),
  );

// sort = ลำดับในหมวด, groupOf = หัวข้อย่อย, sortInAll = ใช้ลำดับนี้ตอนดูทั้งหมดด้วย
const brakeRule = byPrefix([
  "ตะปูเบรก",
  "กระบอกเบรก",
  "ผ้าเบรกหน้า",
  "ก้ามเบรกหลัง",
]);
const filterRule = byPrefix(["กรองอากาศ", "กรองแอร์"]);
const CATEGORY_RULES = {
  บริการ: { sort: sortServices, sortInAll: true },
  ช่วงล่าง: {
    sort: bySuspensionType,
    groupOf: (item) => getPartType(item.name),
    sortInAll: true,
  },
  [OIL_CATEGORY]: { sort: byOilSize, groupOf: oilGroupOf, sortInAll: true },
  เบรก: { ...brakeRule, sortInAll: true },
  ไส้กรอง: { ...filterRule, sortInAll: true },
  ยาง: { sort: byTireBrand, groupOf: tireBrandOf },
  [USED_TIRE_CATEGORY]: { sort: byRim, groupOf: rimGroupOf },
  ยางใน: { sort: byRim, groupOf: rimGroupOf },
};

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
export const sortForCategory = (category, items) =>
  (CATEGORY_RULES[category]?.sort ?? ((list) => list))(items).filter(
    (item) => category === ALL_CATEGORIES || !isNoCategoryItem(item),
  );

// ทั้งหมด = แยกตามหมวด เรียงตามแถบหมวดหมู่ กลุ่มไม่มีหมวดหมู่อยู่เหนือบริการ
// คืน null เมื่อหมวดนั้นไม่มีหัวข้อย่อย
export const groupInventory = (category, items, categoryOrder = []) => {
  const groupOf = CATEGORY_RULES[category]?.groupOf;
  if (groupOf) return groupBy(items, groupOf);
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
    const rule = CATEGORY_RULES[name];
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
