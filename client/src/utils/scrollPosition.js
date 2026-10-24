import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router";

const PREFIX = "scroll:";

// จอ lg ขึ้นไปตัวที่เลื่อนคือ <main> จอเล็กเลื่อนทั้งหน้าต่าง อ่านทั้งสองที่แล้วเอาค่ามากกว่า
const getMain = () => document.querySelector("main");

// กุญแจของหน้าคลังคิดจากหมวดหมู่อย่างเดียว เพราะพารามิเตอร์อื่นใน URL เปลี่ยนได้เอง
export const inventoryScrollKey = (category) => `inventory:${category || ""}`;

export const saveScrollPosition = (key) => {
  const top = Math.max(window.scrollY || 0, getMain()?.scrollTop || 0);
  try {
    sessionStorage.setItem(PREFIX + key, String(top));
  } catch {
    // โหมดส่วนตัวบางเครื่องเขียนไม่ได้ ปล่อยผ่าน
  }
};

const takeScrollPosition = (key) => {
  try {
    const value = sessionStorage.getItem(PREFIX + key);
    if (value === null) return null;
    sessionStorage.removeItem(PREFIX + key);
    return Number(value) || 0;
  } catch {
    return null;
  }
};

// จำตำแหน่งระหว่างเลื่อน เพราะตอนไดอะล็อกปิดเบราว์เซอร์ยังคืนค่าการเลื่อนไม่เสร็จ วัดตอนนั้นจะได้ 0
export const useScrollTracking = (key) => {
  useEffect(() => {
    let frame = 0;
    const save = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        saveScrollPosition(key);
      });
    };

    const main = getMain();
    window.addEventListener("scroll", save, { passive: true });
    main?.addEventListener("scroll", save, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", save);
      main?.removeEventListener("scroll", save);
    };
  }, [key]);
};

// ต้องรอ isReady ให้รายการขึ้นครบก่อน ไม่งั้นหน้ายังสั้น เลื่อนไปไม่ถึง
export const useScrollRestoration = (key, isReady) => {
  // คืนตำแหน่งเฉพาะตอนย้อนกลับ บางเส้นทางกลับด้วยการสั่งไปหน้าเดิม จึงบอกด้วย restoreScroll
  const navigationType = useNavigationType();
  const location = useLocation();
  const canRestore =
    navigationType === "POP" || !!location.state?.restoreScroll;
  const pending = useRef(undefined);
  // เปลี่ยนแท็บ = เปลี่ยนกุญแจ ต้องอ่านตำแหน่งใหม่ เพราะคอมโพเนนต์ไม่ได้ถูกสร้างใหม่
  const lastKey = useRef(null);

  // ต้องเลื่อนให้เสร็จก่อนเฟรมแรก ไม่งั้นเห็นหน้ากระโดด
  useLayoutEffect(() => {
    const apply = (top) => {
      window.scrollTo(0, top);
      const main = getMain();
      if (main) main.scrollTop = top;
    };

    if (lastKey.current !== key) {
      lastKey.current = key;
      pending.current = undefined;
    }

    if (pending.current === undefined) {
      const saved = takeScrollPosition(key);
      pending.current = canRestore ? saved : null;
      if (pending.current === null) apply(0);
    }

    if (!isReady || pending.current === null) return;
    const top = pending.current;
    pending.current = null;
    apply(top);
    // เผื่อรูปหรือฟอนต์ทำให้ความสูงเพิ่มทีหลัง รอบแรกอาจเลื่อนได้ไม่สุด
    requestAnimationFrame(() => apply(top));
  }, [key, isReady]);
};
