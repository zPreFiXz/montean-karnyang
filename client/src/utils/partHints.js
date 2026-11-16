import { getPartType } from "@/utils/suspension";

const keyOf = (text) =>
  String(text || "")
    .trim()
    .toLowerCase();

// ยี่ห้อที่ใช้ในหมวดนี้ เรียงจากใช้บ่อยไปน้อย ตัวพิมพ์ต่างกันนับเป็นยี่ห้อเดียว ใช้ตัวสะกดที่พบบ่อยที่สุด
export const brandOptionsOf = (parts = []) => {
  const groups = new Map();
  for (const { brand } of parts) {
    const key = keyOf(brand);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, { count: 0, spellings: new Map() });
    const group = groups.get(key);
    group.count += 1;
    const spelling = brand.trim();
    group.spellings.set(spelling, (group.spellings.get(spelling) || 0) + 1);
  }
  return [...groups.values()]
    .map(({ count, spellings }) => ({
      name: [...spellings.entries()].sort((a, b) => b[1] - a[1])[0][0],
      count,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "th"))
    .map(({ name }) => ({ id: name, name }));
};

const byCount = (texts) => {
  const counts = new Map();
  for (const text of texts) {
    const value = String(text || "").trim();
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "th"))
    .map(([value]) => value);
};

// อะไหล่: แนะนำชนิด (คำแรกของชื่อ) ระหว่างยังพิมพ์คำแรก ยาง: แนะนำรุ่นที่เคยมีของยี่ห้อนั้น
export const nameSuggestionsOf = (
  parts = [],
  { isTire = false, brand = "", typed = "" } = {},
  limit = 8,
) => {
  const query = keyOf(typed);
  if (isTire) {
    const brandKey = keyOf(brand);
    const models = byCount(
      parts
        .filter((part) => !brandKey || keyOf(part.brand) === brandKey)
        .map((part) => part.name),
    );
    return models
      .filter((name) => keyOf(name).includes(query) && keyOf(name) !== query)
      .slice(0, limit);
  }
  // พิมพ์เลยคำแรกแล้ว (เริ่มใส่รุ่นรถ) ไม่ต้องแนะนำอีก
  if (/\s/.test(String(typed || "").trimStart())) return [];
  return byCount(parts.map((part) => getPartType(part.name)))
    .filter((type) => keyOf(type).startsWith(query) && keyOf(type) !== query)
    .slice(0, limit);
};
