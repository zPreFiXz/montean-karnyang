import { useEffect, useRef } from "react";

const DURATION_MS = 150;

// พ่อแม่เก็บว่าแถวไหนกำลังจะหาย แล้วค่อยลบจริงใน onLeaveEnd
const CollapsibleRow = ({ leaving = false, onLeaveEnd, children }) => {
  const doneRef = useRef(false);

  // transitionend ไม่ยิงถ้าแถวถูกซ่อนด้วย display:none หรือเครื่องตั้งลดการเคลื่อนไหวไว้ จึงมีตัวจับเวลาสำรอง
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
      {/* ตัดเนื้อหาเฉพาะตอนกำลังยุบ ไม่งั้นวงแหวนโฟกัสที่วาดออกนอกขอบ 3px จะโดนตัด */}
      <div className={leaving ? "overflow-hidden" : ""}>{children}</div>
    </div>
  );
};
export default CollapsibleRow;
