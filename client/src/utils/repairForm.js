import { CREDIT_OPTION_ID } from "@/constants/paymentMethods";
import {
  hasTypedUnit,
  isPartLikeItem,
  isSingleQuantityItem,
  lineUnit,
} from "@/constants/services";
import { isMultiUseOil } from "@/utils/oil";

// DB เก็บ side เป็นตัวพิมพ์ใหญ่ (enum LEFT/RIGHT/OTHER) — แปลงเป็นตัวเล็กให้ตรง UI state
export const toUiSide = (side) => (side ? side.toLowerCase() : null);

// คืน { path, repairData, repairItems } สำหรับเปิดแก้ไขบิลที่บันทึกแล้ว
export const repairToForm = (repair) => {
  const plate = repair?.vehicle?.licensePlate?.plateNumber || "";
  // รองรับขีดด้วยเผื่อมีข้อมูลที่บันทึกด้วยรูปแบบเดิมหลงเหลืออยู่
  const [plateLetters = "", plateNumbers = ""] = plate.split(/[\s-]+/);
  const provinceName = repair?.vehicle?.licensePlate?.province || "";

  const repairData = {
    name: repair?.customer?.name || "",
    address: repair?.customer?.address || "",
    phoneNumber: repair?.customer?.phoneNumber || "",
    taxId: repair?.customer?.taxId || "",
    brand: repair?.vehicle?.vehicleModel?.brand || "",
    model: repair?.vehicle?.vehicleModel?.model || "",
    plateLetters,
    plateNumbers,
    // ฟอร์มงานซ่อมเก็บจังหวัดเป็นชื่อ ไม่ใช่ id — ส่ง id ไปดรอปดาวน์จะหาค่าไม่เจอแล้วช่องว่าง
    province: provinceName,
    fleetNo: repair?.vehicle?.fleetNo || "",
    description: repair?.description || "",
    mileage: repair?.mileage != null ? String(repair.mileage) : "",
    type: repair?.type || "GENERAL",
    // บิลขายหน้าร้านเก็บเงินไปแล้ว ต้องยกวิธีชำระเงินเดิมไปด้วย
    // บิลเครดิตไม่มีวิธีจ่ายเก็บไว้ ต้องบอกด้วยตัวสถานะแทน
    paymentMethod:
      repair?.status === "CREDIT"
        ? CREDIT_OPTION_ID
        : repair?.paymentMethod || "",
    // บิลที่ไม่ได้ผูกกับรถ (งานบริการ) ต้องกลับเข้าโหมดเดิม ไม่งั้นจะถูกบังคับให้เลือกรถ
    noVehicle: !repair?.vehicle,
  };

  const normalizedItems = (repair?.repairItems || []).map((ri) => {
    if (ri.part) {
      // ชื่อที่ระบบประกอบมีชื่อในคลังอยู่ข้างในเสมอ ถ้าไม่มีแปลว่าถูกพิมพ์ทับ ต้องยกชื่อจากบิลกลับมา
      // น้ำมันที่เลือกงานไว้ต้องยกชื่อเต็มกลับมาด้วย ไม่งั้นงานที่เลือกจะหาย
      const hasCustomName =
        (!!ri.part.name && !String(ri.itemName || "").includes(ri.part.name)) ||
        (isMultiUseOil(ri.part) && !!ri.itemName);

      return {
        id: ri.part.id,
        partNumber: ri.part.partNumber,
        // ยี่ห้อต้องคงไว้ เพราะการนับสต็อกคืนใช้ตรวจว่าเป็นอะไหล่จริง
        brand: ri.part.brand || "",
        name: hasCustomName ? ri.itemName : ri.part.name || "",
        hasCustomName,
        sellingPrice: Number(ri.unitPrice),
        // สต็อกดิบ หน้ากรอกจะบวกของที่บิลนี้เบิกไปคืนเอง (ดู restoredStockMap)
        // ชื่อฟิลด์ต้องเป็น stockQuantity ไม่งั้นเพดานจะเป็นศูนย์
        stockQuantity: ri.part.stockQuantity ?? 0,
        unit: ri.part.unit,
        category: ri.part.category,
        secureUrl: ri.part.secureUrl || null,
        attributes: ri.part.attributes || null,
        quantity: ri.quantity || 1,
        side: toUiSide(ri.side),
      };
    }
    return {
      id: ri.service?.id,
      brand: "",
      // ชื่อที่บันทึกไว้มาก่อน เพราะบริการอย่างค่าแรงพิมพ์ชื่อเองได้
      name: ri.itemName || ri.service?.name || "",
      // ชื่อบนบรรทัดถูกพิมพ์ทับไปแล้ว ดูจากชื่อบริการต้นทางว่าเป็นบรรทัดอะไหล่ไหม
      isPartLine: isPartLikeItem(ri),
      isSingleLine: isSingleQuantityItem(ri),
      isTypedUnitLine: hasTypedUnit(ri),
      unit: lineUnit(ri),
      sellingPrice: Number(ri.unitPrice),
      category: ri.service?.category,
      secureUrl: ri.service?.secureUrl || null,
      quantity: ri.quantity || 1,
      side: toUiSide(ri.side),
    };
  });

  return {
    path:
      repair.type === "SUSPENSION" ? "/inspections/suspension" : "/repairs/new",
    repairData,
    repairItems: normalizedItems,
  };
};
