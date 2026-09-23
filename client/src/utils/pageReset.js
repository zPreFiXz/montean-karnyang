import { useSyncExternalStore } from "react";

// กดแท็บของหน้าที่เปิดอยู่ = อยากกลับไปเริ่มหน้านั้นใหม่ (แบบแอปมือถือทั่วไป)
// ลิงก์ไปเส้นทางเดิม React จะใช้หน้าตัวเดิมต่อ ตัวกรองกับคำค้นที่อยู่ในหน้าจึงค้าง
// ทั้งที่ URL ถูกล้างไปแล้ว รายการที่เห็นเลยไม่ตรงกับตัวกรอง
// ตัวนับนี้ใช้เป็น key ของหน้า เพิ่มค่าเมื่อไหร่หน้าจะถูกสร้างใหม่ทั้งหน้า
let resetCount = 0;
const listeners = new Set();

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const resetCurrentPage = () => {
  resetCount += 1;
  listeners.forEach((listener) => listener());
  window.scrollTo(0, 0);
  const main = document.querySelector("main");
  if (main) main.scrollTop = 0;
};

export const usePageResetKey = () =>
  useSyncExternalStore(subscribe, () => resetCount);
