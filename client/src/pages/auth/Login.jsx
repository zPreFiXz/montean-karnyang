import useAuthStore from "@/stores/authStore";
import { useNavigate } from "react-router";

const Login = () => {
  const navigate = useNavigate();
  const { actionLogin } = useAuthStore((state) => state.actionLogin);
  const user = useAuthStore((state) => state.user);

  const roleRedirect = (role) => {
    if (role === "EMPLOYEE") {
      navigate("/dashboard");
    } else {
      navigate("/admin");
    }
  };

  return <div>Login</div>;
};
export default Login;
