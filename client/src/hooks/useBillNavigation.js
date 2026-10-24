import { useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { clearDraft } from "@/utils/repairDraft";

// draftKind = ชื่อร่างของหน้านั้น ถอยกลับไปหน้าประวัติรถแล้วต้องทิ้งร่าง
const useBillNavigation = (draftKind) => {
  const location = useLocation();
  const navigate = useNavigate();

  // ยึดค่าไว้ตลอดอายุหน้า ถ้าอ่านจาก location.state สดๆ จังหวะที่ state หลุด บิลเดิมจะถูกเก็บเป็นร่างของบิลใหม่
  const editingRef = useRef(!!location.state?.editRepairId);
  if (location.state?.editRepairId) editingRef.current = true;
  const isEditing = editingRef.current;

  const canReturnToVehicle =
    !isEditing &&
    !!(location.state?.vehicleId ?? window.history.state?.usr?.vehicleId);

  // ใช้ backIdx เดียวกับตอนบันทึก ถ้าถอยทีละหน้าอาจวนกลับมาเจอหน้ากรอกบิลอีก
  const handleCancelEdit = () => {
    const backIdx =
      location.state?.backIdx ?? window.history.state?.usr?.backIdx;
    const currentIdx = window.history.state?.idx;
    const targetIdx = backIdx + 1;
    if (
      typeof backIdx === "number" &&
      typeof currentIdx === "number" &&
      targetIdx >= 0 &&
      targetIdx < currentIdx
    ) {
      navigate(targetIdx - currentIdx);
    } else {
      navigate(-1);
    }
  };

  // ถอยกลับไปหน้าประวัติรถ = ไม่เอาบิลนี้แล้ว ร่างที่เพิ่งเติมให้ไม่ควรค้างไปโผล่ตอนเปิดบิลใหม่
  const handleBackToVehicle = () => {
    clearDraft(draftKind);
    handleCancelEdit();
  };

  return {
    isEditing,
    canReturnToVehicle,
    handleCancelEdit,
    handleBackToVehicle,
  };
};

export default useBillNavigation;
