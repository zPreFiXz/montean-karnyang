import { TIRE_UNIT } from "@/constants/units";
import {
  isTireCategoryName,
  getCategoryKind,
  USED_TIRE_CATEGORY,
} from "@/constants/categories";
import { DEFAULT_TIRE_CONSTRUCTION } from "@/utils/tireSize";
import { sortTireLots } from "@/utils/tireLot";
import { toPerSide, toSideOptionId } from "@/utils/suspension";

// ค่าในฟอร์มจากรายการในคลัง (ไม่รวม categoryId ที่ต้องหาจากรายการหมวดหมู่)
// ค่า null ต้องเป็นข้อความว่าง ไม่งั้นตัวตรวจข้อมูลฟ้องว่าชนิดไม่ตรง
export const itemToFormValues = (item) => {
  const base = {
    description: item.description || "",
    categoryKind: getCategoryKind(item.category?.name),
  };

  if (item.type === "service") {
    return {
      ...base,
      name: item.name,
      price: item.price,
      unit: item.unit || "",
      suspensionType: toSideOptionId(item.attributes),
    };
  }

  const values = {
    ...base,
    partNumber: item.partNumber,
    brand: item.brand || "",
    name: item.name || "",
    costPrice: item.costPrice ?? "",
    sellingPrice: item.sellingPrice,
    // ช่องหน่วยของยางถูกซ่อน ข้อมูลเก่าที่เป็นหน่วยอื่นจึงต้องบังคับให้ตรงตอนโหลด
    unit: isTireCategoryName(item.category?.name) ? TIRE_UNIT : item.unit || "",
    stockQuantity: item.stockQuantity,
    minStockLevel: item.minStockLevel,
    oilSourceId: item.oilSourceId || "",
    oilLiters: item.oilLiters != null ? String(Number(item.oilLiters)) : "",
  };

  if (item.attributes) {
    Object.assign(values, {
      width: item.attributes.width || "",
      aspectRatio: item.attributes.aspectRatio || "",
      rimDiameter: item.attributes.rimDiameter || "",
      // ยางที่บันทึกก่อนมีตัวเลือกนี้ถือเป็นเรเดียล
      construction: item.attributes.construction || DEFAULT_TIRE_CONSTRUCTION,
      suspensionType: toSideOptionId(item.attributes),
    });
  }

  // เรียงตอนโหลดครั้งเดียว ถ้าเรียงระหว่างพิมพ์แถวจะสลับที่ใต้เคอร์เซอร์
  if (item.tireLots?.length) {
    values.tireLots = sortTireLots(item.tireLots).map((lot) => ({
      dotCode: lot.dotCode ?? "",
      quantity: lot.quantity == null ? "" : String(lot.quantity),
    }));
  }

  if (item.compatibleVehicles) {
    values.compatibleVehicles = item.compatibleVehicles;
  }

  return values;
};

export const toServicePayload = (data, image) => ({
  name: data.name,
  price: data.price,
  description: data.description || undefined,
  unit: data.unit?.trim() || undefined,
  perSide: toPerSide(data.suspensionType),
  image,
  categoryId: data.categoryId,
});

// kind: { isUsedTire, isTire, lotTracked, isOilKit, hasSideChoice, compatibleVehicles }
// compatibleVehicles มาแยกเพราะไม่อยู่ในสคีมา ข้อมูลที่ผ่านตัวตรวจจึงไม่มีช่องนี้
export const toPartPayload = (data, image, kind) => ({
  partNumber: data.partNumber,
  brand: kind.isUsedTire ? "" : data.brand,
  name: kind.isUsedTire ? USED_TIRE_CATEGORY : data.name,
  costPrice: data.costPrice,
  sellingPrice: data.sellingPrice,
  unit: data.unit,
  // ยางที่นับเป็นล็อต สต็อกคิดจากผลรวมล็อตที่ฝั่งเซิร์ฟเวอร์
  stockQuantity: kind.lotTracked ? undefined : data.stockQuantity,
  // ชุดน้ำมันเตือนสต็อกที่ตัวเก็บน้ำมันแทน
  minStockLevel: kind.isOilKit ? 0 : data.minStockLevel,
  oilSourceId: kind.isOilKit ? Number(data.oilSourceId) : null,
  oilLiters: kind.isOilKit ? Number(data.oilLiters) : null,
  attributes: kind.isTire
    ? {
        width: data.width,
        aspectRatio: data.aspectRatio,
        rimDiameter: data.rimDiameter,
        construction: data.construction || DEFAULT_TIRE_CONSTRUCTION,
      }
    : // เปลี่ยนไปหมวดที่ไม่มีช่องข้าง ค่าเดิมต้องไม่ติดไปด้วย
      { perSide: kind.hasSideChoice && toPerSide(data.suspensionType) },
  tireLots: kind.lotTracked
    ? (data.tireLots || []).map((lot) => ({
        dotCode: lot.dotCode,
        quantity: Number(lot.quantity) || 0,
      }))
    : undefined,
  compatibleVehicles: kind.compatibleVehicles,
  description: data.description || undefined,
  image,
  categoryId: data.categoryId,
});
