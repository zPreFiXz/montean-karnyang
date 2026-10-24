import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";

// กดแท็บของหน้าที่เปิดอยู่ = เริ่มหน้านั้นใหม่ ส่งเลขรอบไปกับการเปลี่ยนหน้าแล้วใช้เป็น key
// หน้าจึงถูกสร้างใหม่ในจังหวะเดียวกับที่ URL เปลี่ยน ไม่งั้นจะวาดหน้าใหม่ด้วย URL เก่าหนึ่งเฟรม
export const usePageResetKey = () => {
  const location = useLocation();
  const keyRef = useRef(0);
  const token = location.state?.pageReset;
  // ยึดค่าไว้ต่อ เพราะเปลี่ยนหมวดหรือค้นหาในหน้าจะเขียน URL ใหม่โดยไม่มีเลขนี้ติดไป
  if (token && token !== keyRef.current) keyRef.current = token;

  // เลื่อนขึ้นหลังหน้าใหม่ถูกวาด ไม่งั้นเห็นหน้าเดิมเลื่อนก่อนแล้วค่อยเปลี่ยน
  const key = keyRef.current;
  useLayoutEffect(() => {
    if (!key) return;
    window.scrollTo(0, 0);
    const main = document.querySelector("main");
    if (main) main.scrollTop = 0;
  }, [key]);

  return key;
};

export const useResetCurrentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (to) => {
    // ไม่มีตัวกรองให้ล้าง แค่เลื่อนกลับบนสุด ไม่ต้องสร้างหน้าใหม่ให้โหลดซ้ำ
    if (!location.search) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate(to, { state: { pageReset: Date.now() } });
  };
};
