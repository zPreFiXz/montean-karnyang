import { currentAdmin } from "@/api/auth";
import useAuthStore from "@/stores/authStore";
import { useState, useEffect } from "react";
import LoadingToRedirect from "./LoadingToRedirect";

const ProtectRouteAdmin = ({ element }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      currentAdmin()
        .then((res) => setIsAuthenticated(true))
        .catch((err) => setIsAuthenticated(false));
    }
  }, []);

  return isAuthenticated ? element : <LoadingToRedirect />;
};
export default ProtectRouteAdmin;
