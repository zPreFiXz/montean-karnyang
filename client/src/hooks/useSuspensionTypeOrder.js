import { useEffect, useState } from "react";
import { getSuspensionTypeOrder } from "@/api/suspensionTypeOrder";
import { DEFAULT_TYPE_ORDER } from "@/utils/suspension";

// จำไว้ทั้งแอป สลับแท็บไปมาจะได้ไม่โหลดซ้ำ หน้าจัดเรียงเรียก setCachedTypeOrder หลังบันทึก
let cached = null;
const listeners = new Set();

export const setCachedTypeOrder = (order) => {
  cached = order;
  listeners.forEach((listener) => listener(order));
};

// โหลดไม่ได้ก็ใช้ลำดับตั้งต้น หน้าเช็กช่วงล่างยังใช้งานต่อได้
const useSuspensionTypeOrder = () => {
  const [order, setOrder] = useState(cached || DEFAULT_TYPE_ORDER);

  useEffect(() => {
    listeners.add(setOrder);
    if (!cached) {
      getSuspensionTypeOrder()
        .then((res) => {
          const data = res.data || {};
          setCachedTypeOrder({
            side: data.side?.length ? data.side : DEFAULT_TYPE_ORDER.side,
            other: data.other?.length ? data.other : DEFAULT_TYPE_ORDER.other,
          });
        })
        .catch(() => {});
    }
    return () => listeners.delete(setOrder);
  }, []);

  return order;
};

export default useSuspensionTypeOrder;
