import { useEffect } from "react";
import { useNavigate } from "react-router";
import useAuthStore from "@/stores/authStore";

const ProtectRouteGuest = ({ element }) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      const role = user.role;
      
      if (role === "EMPLOYEE") {
        navigate("/dashboard");
      } else {
        navigate("/admin");
      }
    }
  }, []);

  return element;
};

export default ProtectRouteGuest;
