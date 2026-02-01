import { useEffect } from "react";
import { useNavigate } from "react-router";
import useAuthStore from "@/stores/authStore";

const ProtectRouteGuest = ({ element }) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // ถ้า login แล้ว redirect ไป dashboard (ทุก role)
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  return element;
};

export default ProtectRouteGuest;
