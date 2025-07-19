import { currentUser } from "@/api/auth";
import useAuthStore from "@/stores/authStore";
import { useState, useEffect } from "react";
import LoadingToRedirect from "./LoadingToRedirect";

const ProtectRouteUser = ({ element }) => {
  const [ok, isOk] = useState(false);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (user && token) {
      currentUser(token)
        .then((res) => isOk(true))
        .catch((err) => isOk(false));
    }
  }, []);

  return ok ? element : <LoadingToRedirect />;
};
export default ProtectRouteUser;
