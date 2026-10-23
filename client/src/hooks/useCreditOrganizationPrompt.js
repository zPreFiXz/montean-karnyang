import { useRef, useState } from "react";

// บิลเครดิตมักเป็นของหน่วยงานราชการหรือร้านค้าที่มาเคลียร์ทีเดียวตอนสิ้นเดือน
// ตั้งประเภทไว้ที่ตัวลูกค้า บิลใบต่อไปของรายเดียวกันจึงถูกรวมให้เอง
//
// ลูกค้ายังไม่เคยตั้งประเภท ถามก่อนแล้วค่อยลงเครดิต ตอบแล้วจะวนกลับมาทำต่อเอง
// ถามก่อนเพราะถ้าปิดกล่องทิ้ง บิลจะได้ไม่ถูกลงเครดิตไปแล้วทั้งที่ยังไม่ได้ตอบ
export const useCreditOrganizationPrompt = (repair) => {
  const [isOpen, setIsOpen] = useState(false);
  // จำว่ากล่องถูกเปิดระหว่างกำลังลงเครดิตหรือเปล่า (null = ไม่ได้อยู่ในขั้นตอนนั้น)
  // และตอบว่าอะไร เพื่อให้ลงเครดิตทำต่อได้ทันทีหลังบันทึกประเภท
  const pendingSkipRef = useRef(null);
  const answeredRef = useRef(false);
  const answeredTypeRef = useRef(null);
  // ประเภทที่เพิ่งเปลี่ยนระหว่างเปิดบิลนี้ ใช้เลือกปลายทางของปุ่มย้อนกลับ
  const changedTypeRef = useRef(undefined);

  const askBeforeCredit = (nextStatus, skipToCompleted) => {
    if (
      nextStatus !== "CREDIT" ||
      !repair?.customer ||
      repair.customer.organizationType ||
      answeredRef.current
    ) {
      return false;
    }
    pendingSkipRef.current = skipToCompleted;
    setIsOpen(true);
    return true;
  };

  // ประเภทที่เพิ่งเลือกในกล่องยังไม่อยู่ในข้อมูลบิลที่ถืออยู่ ใช้ค่าที่จำไว้ก่อน
  const creditType = () =>
    answeredRef.current
      ? answeredTypeRef.current
      : repair?.customer?.organizationType;

  // onResume: ถูกถามระหว่างกำลังลงเครดิต ตอบแล้วก็ลงเครดิตต่อให้จบ
  // onChanged: แก้ป้ายของลูกค้าเฉยๆ บิลที่เปิดอยู่ยังเป็นใบเดิม
  const dialogProps = ({ onResume, onChanged }) => ({
    isOpen,
    // ปิดกล่องโดยไม่ตอบ = ยังไม่ลงเครดิต บิลอยู่สถานะเดิม
    onClose: () => {
      pendingSkipRef.current = null;
      setIsOpen(false);
    },
    customer: repair?.customer,
    // อยู่ระหว่างลงเครดิต ข้อความแจ้งผลจะมาทีเดียวตอนลงเครดิตเสร็จ
    silent: pendingSkipRef.current !== null,
    onSaved: (type) => {
      setIsOpen(false);
      if (pendingSkipRef.current !== null) {
        const skipToCompleted = pendingSkipRef.current;
        pendingSkipRef.current = null;
        answeredRef.current = true;
        answeredTypeRef.current = type;
        onResume(skipToCompleted);
        return;
      }
      changedTypeRef.current = type;
      onChanged(type);
    },
  });

  return {
    open: () => setIsOpen(true),
    askBeforeCredit,
    creditType,
    changedType: () => changedTypeRef.current,
    dialogProps,
  };
};
