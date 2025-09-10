import useAuthStore from "@/stores/authStore";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import FormInput from "@/components/forms/FormInput";
import { toast } from "sonner";
import { loginSchema } from "@/utils/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import logo from "@/assets/logo.png";
import FormButton from "@/components/forms/FormButton";
import { useEffect } from "react";
import {
  Mail,
  Lock,
  Wrench,
  Car,
  Package,
  Settings,
  User,
  Gauge,
  Warehouse,
  Cog,
} from "lucide-react";

const Login = () => {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(loginSchema),
  });
  const navigate = useNavigate();
  const actionLogin = useAuthStore((state) => state.actionLogin);
  const { errors } = formState;

  // แสดง toast เมื่อ logout สำเร็จ
  useEffect(() => {
    const isLoggedOut = localStorage.getItem("justLoggedOut");
    if (isLoggedOut) {
      toast.success("ออกจากระบบเรียบร้อยแล้ว");
      localStorage.removeItem("justLoggedOut");
    }
  }, []);

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
        error.res?.data?.message ||
        error.res?.data?.errors[0]?.message ||
        error.response.data.message;
      toast.error(errorMessage);
    }
  };

  return (
    <main className="relative min-h-screen p-[24px] font-athiti bg-surface">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <Wrench className="absolute w-20 h-20 top-1 left-4 rotate-12 text-primary/15" />
        <Car className="absolute w-20 h-20 bottom-25 left-4 rotate-3 text-primary/15" />
        <Settings className="absolute w-22 h-22 bottom-15 right-6 rotate-45 text-primary/15" />
        <Gauge className="absolute w-16 h-16 top-29 right-10 rotate-6 text-primary/15" />
        <Package className="absolute w-20 h-20 bottom-55 left-40 -rotate-6 text-primary/15" />
      </div>

      <div className="relative z-20 flex flex-col items-center w-full mt-[24px]">
        <div className="flex flex-col items-center mb-12 text-center">
          <img src={logo} alt="มณเฑียรการยาง" className="w-auto h-19 md:h-26" />
        </div>
        <div className="relative z-30 w-full md:w-[500px] p-[24px] rounded-[24px] bg-white shadow-primary">
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-[16px]">
            <p className="flex justify-center items-center gap-[8px] font-semibold text-[30px] md:text-[32px] text-primary">
              <Warehouse />
              เข้าสู่ระบบ
            </p>
            <FormInput
              register={register}
              name="email"
              type="email"
              label={
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  <p className="font-semibold">อีเมล</p>
                </div>
              }
              placeholder="example@gmail.com"
              color="primary"
              errors={errors}
              customClass="px-0"
            />

            <FormInput
              register={register}
              name="password"
              type="password"
              label={
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  <p className="font-semibold">รหัสผ่าน</p>
                </div>
              }
              placeholder="••••••••"
              color="primary"
              errors={errors}
              customClass="px-0"
            />

            <FormButton
              label="เข้าสู่ระบบ"
              isLoading={formState.isSubmitting}
              className="w-full ml-0 bg-gradient-primary"
            />
          </form>
        </div>
      </div>
    </main>
  );
};
export default Login;
