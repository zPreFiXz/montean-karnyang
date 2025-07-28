import { currentUser } from "@/api/auth";
import useAuthStore from "@/stores/authStore";
import { useState, useEffect } from "react";
import LoadingToRedirect from "./LoadingToRedirect";

const ProtectRouteUser = ({ element }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      currentUser()
        .then((res) => setIsAuthenticated(true))
        .catch((err) => setIsAuthenticated(false));
    }
  }, []);

  return isAuthenticated ? element : <LoadingToRedirect />;
};
export default ProtectRouteUser;
