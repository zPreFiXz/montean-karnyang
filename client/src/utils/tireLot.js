// DOT เก็บเป็น WWYY (สัปดาห์+ปี ค.ศ. 2 หลักท้าย) เช่น 0126 = สัปดาห์ 1 ปี 2026
// การเรียงเก่า→ใหม่จึงต้องสลับเป็น YYWW ก่อน ไม่งั้น 5225 (สัปดาห์ 52 ปี 25) จะไปอยู่หลัง 0126
// ค่าที่ไม่ใช่เลข 4 หลัก (เช่น "ไม่ระบุ" ของยางเก่าที่ backfill มา) ตกไปท้ายสุด
export const dotOrderKey = (dotCode) => {
  const match = /^(\d{2})(\d{2})$/.exec(String(dotCode ?? "").trim());
  return match ? Number(match[2] + match[1]) : Number.MAX_SAFE_INTEGER;
};

export const sortTireLots = (lots = []) =>
  [...lots].sort((a, b) => dotOrderKey(a.dotCode) - dotOrderKey(b.dotCode));

// ล็อตที่ขายไปในบิล (RepairItem.soldLots) เรียงเก่า→ใหม่ พร้อมใช้แสดงทีละใบ
export const soldLotEntries = (soldLots) => {
  if (!Array.isArray(soldLots)) return [];
  return sortTireLots(soldLots).filter((lot) => lot?.dotCode);
};

// ล็อตที่ขายไปในบิล → "0126×3, 0626×1" สำหรับที่ที่ต้องการบรรทัดเดียว
// รูปแบบข้อความอยู่ที่นี่ที่เดียว เปลี่ยนได้อิสระเพราะฐานข้อมูลเก็บเป็น JSON ไม่ใช่ข้อความนี้
export const formatSoldLots = (soldLots) =>
  soldLotEntries(soldLots)
    .map((lot) => `${lot.dotCode}×${lot.quantity}`)
    .join(", ");
