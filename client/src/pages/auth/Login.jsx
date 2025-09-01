import useAuthStore from "@/stores/authStore";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import FormInput from "@/components/forms/FormInput";
import { toast } from "sonner";
import { loginSchema } from "@/utils/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import logo from "@/assets/logo.png";

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
      <div className="font-athiti min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
            <div className="h-20 w-auto mb-10">
              <img src={logo} alt="มณเฑียรการยาง"/>
            </div>
          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl p-4 backdrop-blur-sm border border-white/20">
            <div className="flex justify-center text-3xl font-semibold text-gray-900">
              เข้าสู่ระบบ
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormInput 
                register={register}
                name="email"
                type="email"
                label="อีเมล"
                placeholder="กรุณากรอกอีเมล"
                color="primary"
                errors={errors}
              />
              <FormInput
                register={register}
                name="password"
                type="password"
                label="รหัสผ่าน"
                placeholder="กรุณากรอกรหัสผ่าน"
                color="primary"
                errors={errors}
              />

              <button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold"
              >
                เข้าสู่ระบบ
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
};
export default Login;
