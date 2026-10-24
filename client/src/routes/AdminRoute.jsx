import { useState, useEffect } from "react";
import { Navigate } from "react-router";
import { currentAdmin } from "@/api/auth";
import useAuthStore from "@/stores/useAuthStore";

// ตรวจกับเซิร์ฟเวอร์เบื้องหลัง ไม่ได้ลดความปลอดภัย เพราะทุก API ผ่าน authCheck อยู่แล้ว
const AdminRoute = ({ element }) => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [isDenied, setIsDenied] = useState(
    !user || !token || user.role !== "ADMIN",
  );

  useEffect(() => {
    if (!user || !token) {
      setIsDenied(true);
      return;
    }

    let cancelled = false;
    currentAdmin().catch(() => !cancelled && setIsDenied(true));

    return () => {
      cancelled = true;
    };
  }, [user, token]);

  if (isDenied) return <Navigate to="/dashboard" replace />;
  return element;
};

export default AdminRoute;
