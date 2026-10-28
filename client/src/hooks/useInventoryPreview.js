import { useState } from "react";
import { getInventory } from "@/api/inventory";
import { toastError } from "@/utils/handleError";

// key มาจากรายงาน ("part:id" / "service:id" / "name:...")
// จุ๊บลมเก็บเป็นบริการก็เปิดดูได้ บรรทัดที่เหลือแต่ชื่อในบิล (ของถูกลบจากสต็อกแล้ว) เปิดไม่ได้
export const inventoryRefOf = (item) => {
  const [type, id] = item.key.split(":");
  return type === "part" || type === "service" ? { type, id } : null;
};

// เปิดหน้าต่างรายละเอียดอะไหล่จากแถวในรายงาน onBeforeOpen ใช้จำค่าก่อนหน้าต่างเดิมถูกซ่อน
const useInventoryPreview = ({ onBeforeOpen } = {}) => {
  const [previewItem, setPreviewItem] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const openPreview = async (item) => {
    const ref = inventoryRefOf(item);
    if (!ref) return;
    try {
      const res = await getInventory(ref.id, ref.type);
      onBeforeOpen?.();
      setPreviewItem(res.data);
      setIsPreviewOpen(true);
    } catch (error) {
      toastError(error);
    }
  };

  return { previewItem, isPreviewOpen, setIsPreviewOpen, openPreview };
};

export default useInventoryPreview;
