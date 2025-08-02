import { useEffect } from "react";
import { useNavigate } from "react-router";
import useAuthStore from "@/stores/authStore";

const ProtectRouteGuest = ({ element }) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      const { role } = user;

      if (role === "EMPLOYEE") {
        navigate("/dashboard", { replace: true });
      } else if (role === "ADMIN") {
        navigate("/admin", { replace: true });
      }
    }
  }, []);

  return element;
};

export default ProtectRouteGuest;
