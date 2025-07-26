import { currentAdmin } from "@/api/auth";
import useAuthStore from "@/stores/authStore";
import { useState, useEffect } from "react";
import LoadingToRedirect from "./LoadingToRedirect";

const ProtectRouteAdmin = ({ element }) => {
  const [ok, setOk] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      currentAdmin()
        .then((res) => setOk(true))
        .catch((err) => setOk(false));
    }
  }, []);

  return element;
};
export default ProtectRouteAdmin;
