import { useState, useEffect } from "react";
import { Navigate } from "react-router";
import { currentUser } from "@/api/auth";
import useAuthStore from "@/stores/useAuthStore";
import LoadingToRedirect from "./LoadingToRedirect";

// กันหน้า private: ตรวจ token กับ server ทุกครั้งที่เข้า
const ProtectRouteUser = ({ element }) => {
  const [status, setStatus] = useState("checking"); // checking | ok | denied
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!user || !token) {
      setStatus("denied");
      return;
    }

    let cancelled = false;
    currentUser()
      .then(() => !cancelled && setStatus("ok"))
      .catch(() => !cancelled && setStatus("denied"));

    return () => {
      cancelled = true;
    };
  }, [user, token]);

  if (status === "denied") return <Navigate to="/login" replace />;
  if (status === "checking") return <LoadingToRedirect />;
  return element;
};

export default ProtectRouteUser;
