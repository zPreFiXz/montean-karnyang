import { useLayoutEffect, useRef, useState } from "react";

// ใช้ทั้งตัวอย่างใบเสร็จและใบวางบิล คลาสของหน้าต่างต้องตรงกับค่าข้างล่าง
// แถวที่ไม่ใช่กระดาษติดคลาส .receipt-chrome
export const PAPER_WIDTH_MM = 148;
export const PAPER_HEIGHT_MM = 210;
// 1 มิลลิเมตร = 96/25.4 พิกเซลตามมาตรฐาน CSS ใช้คำนวณขนาดกรอบหลังย่อ
export const MM = 96 / 25.4;

// ระยะห่างรอบกรอบดูตัวอย่าง ต้องตรงกับคลาสที่ใช้จริง
const VIEWPORT_MARGIN = 16;
// เพดานขนาดไดอะล็อก ต้องตรงกับคลาสที่ใช้จริงเช่นกัน
const DIALOG_MAX_WIDTH = 620;
// ไม่ให้กล่องชนเพดานความสูง ไม่งั้นแถบที่อยู่มือถือยุบ/กางแล้วกล่องเปลี่ยนขนาด
const DIALOG_MAX_HEIGHT_RATIO = 0.88;

const estimateFitScale = (chromeEstimate) => {
  if (typeof window === "undefined") return 1;

  const maxDialogWidth = Math.min(DIALOG_MAX_WIDTH, window.innerWidth - 32);
  const availableWidth = maxDialogWidth - VIEWPORT_MARGIN * 2;
  const availableHeight =
    window.innerHeight * DIALOG_MAX_HEIGHT_RATIO -
    chromeEstimate -
    VIEWPORT_MARGIN * 2;

  return (
    Math.min(
      availableWidth / (PAPER_WIDTH_MM * MM),
      availableHeight / (PAPER_HEIGHT_MM * MM),
    ) * 0.98
  );
};

// chromeEstimate = ความสูงโดยประมาณของส่วนที่ไม่ใช่กระดาษ ใช้เดาขนาดก่อนวัดของจริง
// onOpen = ล้างตัวเลือกของหน้าต่างทุกครั้งที่เปิด (ทำก่อนวัด)
const usePaperFit = ({ open, chromeEstimate, onOpen }) => {
  const contentRef = useRef(null);
  const paperRef = useRef(null);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const [fitScale, setFitScale] = useState(() =>
    estimateFitScale(chromeEstimate),
  );
  // ซ่อนไว้จนวัดเสร็จ ไม่งั้นเห็นแผ่นใหญ่วูบแล้วหด
  const [isMeasured, setIsMeasured] = useState(false);

  // ต้องวัดก่อนจอวาดเฟรมแรก
  useLayoutEffect(() => {
    if (!open) return;
    setIsMeasured(false);
    onOpenRef.current?.();
    setFitScale(estimateFitScale(chromeEstimate));

    const fit = () => {
      const paper = paperRef.current;
      const paperWidth = paper?.offsetWidth;
      const paperHeight = paper?.offsetHeight;

      // วัดไม่ได้ก็ต้องปลดการซ่อน ไม่งั้นกล่องจะถูกซ่อนค้างจนดูเหมือนเปิดไม่ขึ้น
      if (!paperWidth || !paperHeight) {
        setIsMeasured(true);
        return;
      }

      // คิดที่ว่างจากขนาดจอลบแถวพวกนี้ ไม่ใช่วัดจากกรอบซึ่งจะวนกันเอง
      const chromeParts =
        contentRef.current?.querySelectorAll(".receipt-chrome") || [];
      const chromeHeight =
        [...chromeParts].reduce((sum, part) => sum + part.offsetHeight, 0) ||
        chromeEstimate;

      const maxDialogWidth = Math.min(DIALOG_MAX_WIDTH, window.innerWidth - 32);
      const availableWidth = maxDialogWidth - VIEWPORT_MARGIN * 2;
      const availableHeight =
        window.innerHeight * DIALOG_MAX_HEIGHT_RATIO -
        chromeHeight -
        VIEWPORT_MARGIN;

      if (availableWidth > 0 && availableHeight > 0) {
        // เผื่อไว้เล็กน้อย กันเศษปัดของเบราว์เซอร์ทำให้ล้นออกไปหนึ่งจุด
        setFitScale(
          Math.min(availableWidth / paperWidth, availableHeight / paperHeight) *
            0.99,
        );
      }
    };

    // วัดซ้ำอีกครั้งในเฟรมถัดไปตอนหน้าจัดเสร็จ แล้วไม่วัดอีก กล่องกลางจอจะได้ไม่เลื่อน
    fit();
    const reveal = requestAnimationFrame(() => {
      fit();
      setIsMeasured(true);
    });

    // วัดใหม่เฉพาะตอนขนาดจอเปลี่ยนจริงจัง เพราะแถบที่อยู่มือถือยุบ/กางได้เอง
    let lastSize = { width: window.innerWidth, height: window.innerHeight };
    const onResize = () => {
      const size = { width: window.innerWidth, height: window.innerHeight };
      const changedALot =
        size.width !== lastSize.width ||
        Math.abs(size.height - lastSize.height) > 120;

      if (!changedALot) return;
      lastSize = size;
      fit();
    };

    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(reveal);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return { contentRef, paperRef, scale: fitScale, isMeasured };
};

export default usePaperFit;
