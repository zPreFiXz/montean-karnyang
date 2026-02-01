import { currentAdmin } from "@/api/auth";
import useAuthStore from "@/stores/authStore";
import { useState, useEffect } from "react";
import LoadingToRedirect from "./LoadingToRedirect";

const ProtectRouteAdmin = ({ element }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      currentAdmin()
        .then(() => setIsAuthenticated(true))
        .catch(() => setIsAuthenticated(false));
    } else {
      setIsAuthenticated(false);
    }
  }, [user]);

  // null = กำลัง check auth
  if (isAuthenticated === null) return null;

  return isAuthenticated ? element : <LoadingToRedirect />;
};

export default ProtectRouteAdmin;
