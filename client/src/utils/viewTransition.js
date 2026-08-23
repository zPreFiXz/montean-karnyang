import { flushSync } from "react-dom";

// เบราว์เซอร์ถ่ายภาพก่อน-หลังแล้วเลื่อนให้เอง เราแค่ต้องบอกว่าแถวไหนคือแถวเดิม
// ผ่าน viewTransitionName — จึงไม่ต้องวัดตำแหน่งหรือคำนวณระยะเอง
//
// flushSync จำเป็น: setState ปกติเป็น async ภาพ "หลัง" จะถูกถ่ายก่อน DOM เปลี่ยน แล้วจะไม่มีอะไรขยับ
export const withViewTransition = (update) => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (!document.startViewTransition || prefersReducedMotion) {
    update();
    return;
  }

  document.startViewTransition(() => flushSync(update));
};
