import { useState, useEffect } from "react";
import { Navigate } from "react-router";
import { currentUser } from "@/api/auth";
import useAuthStore from "@/stores/useAuthStore";

// กันหน้า private: ตรวจ token กับ server ทุกครั้งที่เข้า
// มี session ในเครื่องอยู่แล้วให้เข้าหน้าไปเลย แล้วค่อยตรวจกับเซิร์ฟเวอร์เบื้องหลัง
// ไม่ได้ลดความปลอดภัย เพราะทุก API ผ่าน authCheck ที่เซิร์ฟเวอร์อยู่แล้ว
// การกั้นตรงนี้มีไว้กันไม่ให้เห็นหน้าที่ใช้งานไม่ได้เท่านั้น
const ProtectRouteUser = ({ element }) => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [isDenied, setIsDenied] = useState(!user || !token);

  useEffect(() => {
    if (!user || !token) {
      setIsDenied(true);
      return;
    }

    let cancelled = false;
    currentUser().catch(() => !cancelled && setIsDenied(true));

    return () => {
      cancelled = true;
    };
  }, [user, token]);

  if (isDenied) return <Navigate to="/login" replace />;
  return element;
};

export default ProtectRouteUser;
