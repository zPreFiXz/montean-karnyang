import { useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { clearDraft } from "@/utils/repairDraft";

// ทางกลับของหน้าเปิดบิล (หน้ากรอกบิลและหน้าเช็กช่วงล่าง)
// draftKind = ชื่อร่างของหน้านั้น ถอยกลับไปหน้าประวัติรถแล้วต้องทิ้งร่างที่เพิ่งเติมให้
const useBillNavigation = (draftKind) => {
  const location = useLocation();
  const navigate = useNavigate();

  // แก้บิลเดิมไม่ต้องเก็บร่าง ของจริงอยู่ในฐานข้อมูลแล้ว
  // และร่างของบิลเก่าไม่ควรไปโผล่ตอนเปิดบิลใหม่
  // ยึดค่าไว้ตลอดอายุของหน้า ถ้าอ่านจาก location.state สดๆ อย่างเดียว
  // จังหวะที่ state หลุดระหว่างทางจะกลายเป็นบิลเดิมถูกเก็บเป็นร่างของบิลใหม่
  const editingRef = useRef(!!location.state?.editRepairId);
  if (location.state?.editRepairId) editingRef.current = true;
  const isEditing = editingRef.current;

  // เปิดบิลใหม่จากหน้าประวัติรถ = มีทางกลับไปหน้านั้น (vehicleId ติดมาตลอดทางรวมถึงหน้าสรุป)
  const canReturnToVehicle =
    !isEditing &&
    !!(location.state?.vehicleId ?? window.history.state?.usr?.vehicleId);

  // แก้บิลเดิมอยู่แล้วอยากกลับโดยไม่บันทึก ถอยกลับไปที่หน้าบิลใบนั้น
  // ใช้ตำแหน่งในประวัติเดียวกับตอนบันทึก (backIdx) เพราะถ้าเคยย้อนไปมากับหน้าสรุป
  // จะมีหน้ากรอกบิลซ้อนอยู่ในประวัติ ถอยทีละหน้าจะวนกลับมาเจอหน้ากรอกบิลอีก
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
