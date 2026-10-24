import { useState, useEffect } from "react";
import { Navigate } from "react-router";
import { currentUser } from "@/api/auth";
import useAuthStore from "@/stores/useAuthStore";

// ตรวจกับเซิร์ฟเวอร์เบื้องหลัง ไม่ได้ลดความปลอดภัย เพราะทุก API ผ่าน authCheck อยู่แล้ว
const ProtectedRoute = ({ element }) => {
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

export default ProtectedRoute;
