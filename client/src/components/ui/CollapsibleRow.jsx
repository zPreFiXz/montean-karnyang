import { useEffect, useRef } from "react";

const DURATION_MS = 150;

// ครอบแถวในรายการที่ลบได้ ให้ยุบตัวลงพร้อมจางก่อนหายจริง คนจะได้เห็นว่าอะไรหายไป
// ไม่ใช่แค่เห็นว่าเหลืออะไร — ใช้ให้เหมือนกันทุกรายการในระบบ (รุ่นรถที่ใส่ได้, สัปดาห์/ปีผลิต, รายการซ่อม)
//
// วิธีใช้: พ่อแม่เก็บว่าแถวไหนกำลังจะหาย แล้วค่อยลบจริงใน onLeaveEnd
const CollapsibleRow = ({ leaving = false, onLeaveEnd, children }) => {
  const doneRef = useRef(false);

  // กันแถวค้าง: transitionend ไม่ยิงถ้าแถวถูกซ่อนด้วย display:none (เช่นมุมมองที่ไม่ได้แสดงอยู่)
  // หรือเครื่องที่ตั้งค่าลดการเคลื่อนไหวไว้ จึงมีตัวจับเวลาสำรองเสมอ
  useEffect(() => {
    if (!leaving) {
      doneRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      onLeaveEnd?.();
    }, DURATION_MS + 80);

    return () => clearTimeout(timer);
  }, [leaving, onLeaveEnd]);

  return (
    <div
      // grid-rows 0fr→1fr ยุบไปหาความสูงจริงของเนื้อหา ไม่ต้องเดาเป็นตัวเลข
      className={`grid transition-all duration-150 ${
        leaving ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
      }`}
      onTransitionEnd={(e) => {
        if (e.propertyName !== "grid-template-rows" || !leaving) return;
        if (doneRef.current) return;
        doneRef.current = true;
        onLeaveEnd?.();
      }}
    >
      {/* ตัดเนื้อหาเฉพาะตอนกำลังยุบ — ถ้าเปิด overflow-hidden ค้างไว้ตลอด
          วงแหวนโฟกัสของช่องกรอกที่วาดออกนอกขอบ 3px จะโดนตัดหายทุกด้าน */}
      <div className={leaving ? "overflow-hidden" : ""}>{children}</div>
    </div>
  );
};
export default CollapsibleRow;
