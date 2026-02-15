import { Navigate } from "react-router";
import useAuthStore from "@/stores/useAuthStore";

const ProtectRouteGuest = ({ element }) => {
  const user = useAuthStore((state) => state.user);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return element;
};

export default ProtectRouteGuest;
