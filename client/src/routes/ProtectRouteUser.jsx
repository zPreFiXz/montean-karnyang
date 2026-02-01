import { currentUser } from "@/api/auth";
import useAuthStore from "@/stores/authStore";
import { useState, useEffect } from "react";
import LoadingToRedirect from "./LoadingToRedirect";

const ProtectRouteUser = ({ element }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      currentUser()
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

export default ProtectRouteUser;
