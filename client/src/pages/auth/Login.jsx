import useAuthStore from "@/stores/authStore";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const { actionLogin } = useAuthStore((state) => state.actionLogin);
  const user = useAuthStore((state) => state.user);

  return <div>Login</div>;
};
export default Login;
