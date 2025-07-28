import useAuthStore from "@/stores/authStore";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import FormInput from "@/components/form/FormInput";
import { toast } from "sonner";

const Login = () => {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const actionLogin = useAuthStore((state) => state.actionLogin);

  const roleRedirect = (role) => {
    if (role === "USER") {
      navigate("/dashboard");
    } else if (role === "ADMIN") {
      navigate("/admin");
    }
  };

  const handleLogin = async (data) => {
    try {
      const res = await actionLogin(data);
      const role = res.data.payload.role;
      roleRedirect(role);
      toast.success(res.data.message);
    } catch (error) {
      console.error("Login error:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors[0]?.message;
      toast.error(errorMessage);
    }
  };

  return (
    <main>
      <form onSubmit={handleSubmit(handleLogin)}>
        <FormInput
          register={register}
          name="email"
          type="email"
          label="Email"
          placeholder="Enter your email"
          color="primary"
        />
        <FormInput
          register={register}
          name="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          color="primary"
        />
        <button
          type="submit"
          className="w-full h-[40px] mt-[16px] bg-primary text-white rounded-[20px] hover:bg-primary-dark"
        >
          Login
        </button>
      </form>
    </main>
  );
};
export default Login;
