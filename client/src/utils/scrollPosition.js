import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router";

const PREFIX = "scroll:";

// จอ lg ขึ้นไปตัวที่เลื่อนคือ <main> ส่วนจอเล็กเลื่อนทั้งหน้าต่าง
// อ่านทั้งสองที่แล้วเอาค่ามากกว่า จะได้ไม่ต้องเช็ค breakpoint
const getMain = () => document.querySelector("main");

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

// คืนตำแหน่งที่จำไว้ครั้งเดียวตอนกลับเข้าหน้า ต้องรอ isReady ให้รายการขึ้นครบก่อน
// ไม่งั้นหน้ายังสั้นอยู่ เลื่อนไปไม่ถึง
export const useScrollRestoration = (key, isReady) => {
  // คืนตำแหน่งเฉพาะตอน "ย้อนกลับ" มาที่หน้านี้จริงๆ
  // เข้ามาใหม่จากเมนูอื่นถือเป็นการเริ่มดูใหม่ ต้องอยู่บนสุดเสมอ
  // (บางเส้นทางกลับด้วยการสั่งไปหน้าเดิมตรงๆ ไม่ใช่ถอยประวัติ จึงบอกกันด้วย restoreScroll)
  const navigationType = useNavigationType();
  const location = useLocation();
  const canRestore =
    navigationType === "POP" || !!location.state?.restoreScroll;
  const pending = useRef(undefined);
  // เปลี่ยนแท็บ = เปลี่ยนกุญแจ ถือเป็นการเข้าหน้าใหม่ ต้องอ่านตำแหน่งของกุญแจใหม่
  // ไม่งั้นจะค้างตำแหน่งที่เลื่อนไว้ของแท็บก่อนหน้า เพราะหน้ายังเป็นตัวเดิมไม่ได้ถูกสร้างใหม่
  const lastKey = useRef(null);

  // useLayoutEffect เพราะต้องเลื่อนให้เสร็จก่อนเฟรมแรกที่รายการโผล่
  // ถ้าเลื่อนทีหลังจะเห็นหน้ากระโดดจากบนสุดลงมา
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

    // อ่านตำแหน่งครั้งเดียวตั้งแต่เฟรมแรก ถึงข้อมูลจะมาแล้วตั้งแต่ต้นก็ยังคืนค่าทัน
    if (pending.current === undefined) {
      const saved = takeScrollPosition(key);
      pending.current = canRestore ? saved : null;
      // ไม่มีตำแหน่งที่จำไว้ = เข้าหน้านี้ใหม่ ต้องเริ่มที่บนสุด
      // ไม่งั้นจะค้างตำแหน่งของหน้าก่อนหน้าติดมา
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
