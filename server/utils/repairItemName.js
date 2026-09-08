const { formatTireSize } = require("./tireSize");

// ชื่อรายการซ่อมถูกเก็บเป็น snapshot ตอนบันทึก เพราะอะไหล่ถูกลบได้แล้วประวัติต้องยังอ่านรู้เรื่อง
// ต้องได้ข้อความเดียวกับที่การ์ดฝั่งหน้าจอประกอบขึ้น (RepairItemCard) ไม่งั้นชื่อจะเปลี่ยนหลังลบอะไหล่
exports.buildPartItemName = (part) => {
  if (!part) return null;

  const attributes = part.attributes || null;
  // ต้องตรงกับ TIRE_CATEGORIES ฝั่งหน้าเว็บ ไม่งั้นชื่อในบิลจะไม่มีขนาดยางติดมา
  const isTire = ["ยาง", "ยางเปอร์เซ็นต์"].includes(part.category?.name);

  if (isTire) {
    const size = formatTireSize(attributes);
    if (size) return [part.brand, size, part.name].filter(Boolean).join(" ");
  }

  return [part.brand, part.name].filter(Boolean).join(" ") || null;
};

exports.buildServiceItemName = (service) => service?.name || null;

// ของที่ตวงจากถังใหญ่ ไม่ได้นับเป็นชิ้น จึงไม่ตัดสต็อกและไม่คืนสต็อก
// ต้องตรงกับ UNLIMITED_STOCK_KEYWORDS ฝั่งหน้าเว็บ (client/src/utils/oil.js)
const UNLIMITED_STOCK_KEYWORDS = ["น้ำมันเกียร์"];

exports.isUnlimitedStockPart = (part) =>
  UNLIMITED_STOCK_KEYWORDS.some((keyword) =>
    String(part?.name || "").includes(keyword),
  );
