import { flushSync } from "react-dom";

// flushSync จำเป็น ไม่งั้นภาพ "หลัง" จะถูกถ่ายก่อน DOM เปลี่ยน
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
