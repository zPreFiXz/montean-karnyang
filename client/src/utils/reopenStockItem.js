import { useEffect } from "react";
import { useLocation } from "react-router";
import { getInventory } from "@/api/inventory";

// หน้าอื่นนอกหน้าคลัง (หน้าหลัก หน้ารายละเอียดบิล) เปิดรายละเอียดของในคลังได้
// ออกจากไดอะล็อกไปหน้าแก้ไขหรือประวัติการใช้แล้วกดย้อนกลับ ไดอะล็อกต้องเปิดค้างไว้เหมือนหน้าคลัง
// หน้าเหล่านี้ไม่มีพารามิเตอร์ ?item= จึงฝากไว้ใน state ของรายการในประวัติแทน
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

// ดึงข้อมูลใหม่ทุกครั้ง เพราะเพิ่งแก้หรือเพิ่มสต็อกมา ของที่จำไว้ตอนจากไปเก่าแล้ว
// ล้างเครื่องหมายทิ้งทันที ไม่งั้นรีเฟรชหรือย้อนกลับมาอีกรอบไดอะล็อกจะเด้งเอง
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
