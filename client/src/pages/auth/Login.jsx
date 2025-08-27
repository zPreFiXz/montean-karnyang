import useAuthStore from "@/stores/authStore";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import FormInput from "@/components/forms/FormInput";
import { toast } from "sonner";
import { loginSchema } from "@/utils/schemas";
import { zodResolver } from "@hookform/resolvers/zod";

const Login = () => {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(loginSchema),
  });
  const navigate = useNavigate();
  const actionLogin = useAuthStore((state) => state.actionLogin);
  const { errors } = formState;

  const roleRedirect = (role) => {
    if (role === "EMPLOYEE") {
      navigate("/dashboard");
    } else if (role === "ADMIN") {
      navigate("/dashboard");
    }
  };

  const onSubmit = async (data) => {
    try {
      const res = await actionLogin(data);
      const role = res.data.payload.role;
      roleRedirect(role);
      toast.success(res.data.message);
    } catch (error) {
      console.error(error);

      const errorMessage =
        error.res?.data?.message || error.res?.data?.errors[0]?.message;
      toast.error(errorMessage);
    }
  };

  return (
    <main>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          register={register}
          name="email"
          type="text"
          label="Email"
          placeholder="Enter your email"
          color="primary"
          errors={errors}
        />
        <FormInput
          register={register}
          name="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          color="primary"
          errors={errors}
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
