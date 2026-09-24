import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";

// กดแท็บของหน้าที่เปิดอยู่ = อยากกลับไปเริ่มหน้านั้นใหม่ (แบบแอปมือถือทั่วไป)
// ลิงก์ไปเส้นทางเดิม React จะใช้หน้าตัวเดิมต่อ ตัวกรองกับคำค้นที่อยู่ในหน้าจึงค้าง
// ทั้งที่ URL ถูกล้างไปแล้ว รายการที่เห็นเลยไม่ตรงกับตัวกรอง
//
// ส่งเลขรอบไปกับการเปลี่ยนหน้า แล้วใช้เป็น key ของหน้า หน้าจึงถูกสร้างใหม่ในจังหวะเดียวกับที่ URL เปลี่ยน
// (ถ้าสร้างใหม่ก่อนเปลี่ยน URL จะมีหนึ่งเฟรมที่หน้าใหม่วาดด้วย URL เก่า เห็นเป็นกระพริบ)
export const usePageResetKey = () => {
  const location = useLocation();
  const keyRef = useRef(0);
  const token = location.state?.pageReset;
  // ยึดค่าไว้ต่อ เพราะเปลี่ยนหมวดหรือค้นหาในหน้าจะเขียน URL ใหม่โดยไม่มีเลขนี้ติดไป
  if (token && token !== keyRef.current) keyRef.current = token;

  // กลับบนสุดหลังหน้าใหม่ถูกวาดแล้ว แต่ก่อนเบราว์เซอร์แสดงผล
  // ถ้าสั่งตอนกดแท็บ หน้าเดิมจะเลื่อนขึ้นให้เห็นก่อน แล้วค่อยเปลี่ยนเป็นหน้าใหม่ทีหลัง
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
    // อยู่หน้าหลักของแท็บอยู่แล้ว (ไม่ได้เลือกหมวด ค้นหา หรือกรองอะไร) ไม่มีอะไรให้ล้าง
    // แค่เลื่อนกลับบนสุดแบบแอปทั่วไป ไม่ต้องสร้างหน้าใหม่ให้รายการกับหมวดหมู่หมุนโหลดซ้ำ
    if (!location.search) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate(to, { state: { pageReset: Date.now() } });
  };
};
