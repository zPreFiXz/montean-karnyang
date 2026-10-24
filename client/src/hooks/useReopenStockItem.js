import { useEffect } from "react";
import { useLocation } from "react-router";
import { getInventory } from "@/api/inventory";

// หน้าที่ไม่มีพารามิเตอร์ ?item= ฝากไดอะล็อกที่เปิดอยู่ไว้ใน state ของประวัติแทน
// กดย้อนกลับมาไดอะล็อกจะเปิดค้างไว้เหมือนหน้าคลัง
const KEY = "openStockItem";

// เขียนลงประวัติตรงๆ ไม่ผ่าน router หน้าปัจจุบันจะได้ไม่เรนเดอร์ใหม่แล้วเปิดไดอะล็อกซ้ำระหว่างกำลังออก
export const markStockItemOpen = (item) => {
  const state = window.history.state || {};
  window.history.replaceState(
    {
      ...state,
      usr: { ...state.usr, [KEY]: { type: item.type, id: item.id } },
    },
    "",
  );
};

const clearMark = () => {
  const state = window.history.state || {};
  if (!state.usr?.[KEY]) return;
  const usr = { ...state.usr };
  delete usr[KEY];
  window.history.replaceState({ ...state, usr }, "");
};

// ดึงใหม่ทุกครั้งเพราะเพิ่งแก้มา ล้างเครื่องหมายทันที ไม่งั้นรีเฟรชแล้วจะเด้งเอง
export const useReopenStockItem = (onOpen) => {
  const location = useLocation();
  useEffect(() => {
    const target = location.state?.[KEY];
    if (!target) return;
    clearMark();
    let cancelled = false;
    getInventory(target.id, target.type)
      .then((res) => {
        if (!cancelled && res.data) onOpen(res.data);
      })
      .catch(() => {
        // ของถูกลบไปแล้ว ก็แค่ไม่เปิดไดอะล็อก
      });
    return () => {
      cancelled = true;
    };
    // เปิดครั้งเดียวต่อการเข้าหน้า onOpen เป็นฟังก์ชันใหม่ทุกเรนเดอร์
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);
};
