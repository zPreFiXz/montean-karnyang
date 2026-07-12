import { useState, useEffect } from "react";
import { Navigate } from "react-router";
import { currentAdmin } from "@/api/auth";
import useAuthStore from "@/stores/useAuthStore";
import LoadingToRedirect from "./LoadingToRedirect";

// กันหน้า admin: ตรวจ token + role ADMIN กับ server ทุกครั้งที่เข้า
const ProtectRouteAdmin = ({ element }) => {
  const [status, setStatus] = useState("checking"); // checking | ok | denied
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!user || !token) {
      setStatus("denied");
      return;
    }

    let cancelled = false;
    currentAdmin()
      .then(() => !cancelled && setStatus("ok"))
      .catch(() => !cancelled && setStatus("denied"));

    return () => {
      cancelled = true;
    };
  }, [user, token]);

  if (status === "denied") return <Navigate to="/dashboard" replace />;
  if (status === "checking") return <LoadingToRedirect />;
  return element;
};

export default ProtectRouteAdmin;
