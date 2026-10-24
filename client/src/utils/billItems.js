import { USED_TIRE_CATEGORY, isTireCategoryName } from "@/constants/categories";
import { formatProductName } from "@/utils/tireSize";

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

// บรรทัดซ้าย-ขวาเพิ่มลดทีละคู่ จำนวนนับเป็นชิ้นรวม (2 4 6)
export const stepOf = (item) => (item.side === "both" ? 2 : 1);
