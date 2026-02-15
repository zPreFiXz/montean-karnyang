import useAuthStore from "@/stores/useAuthStore";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import FormInput from "@/components/forms/FormInput";
import { toast } from "sonner";
import { loginSchema } from "@/utils/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import FormButton from "@/components/forms/FormButton";
import { useEffect } from "react";
import {
  Mail,
  Lock,
  Wrench,
  Car,
  Package,
  Settings,
  Gauge,
  Warehouse,
} from "lucide-react";

const Login = () => {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(loginSchema),
  });
  const navigate = useNavigate();
  const actionLogin = useAuthStore((state) => state.actionLogin);
  const { errors } = formState;

  useEffect(() => {
    const isLoggedOut = localStorage.getItem("justLoggedOut");
    if (isLoggedOut) {
      toast.success("ออกจากระบบเรียบร้อยแล้ว");
      localStorage.removeItem("justLoggedOut");
    }
  }, []);

  const onSubmit = async (data) => {
    try {
      const res = await actionLogin(data);
      navigate("/dashboard");
      toast.success(res.data.message);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message);
    }
  };

  return (
    <div className="font-athiti bg-surface relative min-h-screen p-[24px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <Wrench className="text-primary/15 absolute top-1 left-4 h-20 w-20 rotate-12" />
        <Car className="text-primary/15 absolute bottom-25 left-4 h-20 w-20 rotate-3" />
        <Settings className="text-primary/15 absolute right-6 bottom-15 h-22 w-22 rotate-45" />
        <Gauge className="text-primary/15 absolute top-29 right-10 h-16 w-16 rotate-6" />
        <Package className="text-primary/15 absolute bottom-55 left-40 h-20 w-20 -rotate-6" />
      </div>
      <div className="relative z-20 mt-[24px] flex w-full flex-col items-center">
        <div className="mb-12 flex flex-col items-center text-center">
          <img
            src="/logo.png"
            alt="มณเฑียรการยาง"
            className="h-19 w-auto md:h-26"
          />
        </div>
        <div className="bg-surface shadow-primary relative z-30 w-full rounded-[24px] p-[24px] md:w-[500px]">
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-[16px]"
          >
            <p className="text-primary flex items-center justify-center gap-[8px] text-[30px] font-semibold md:text-[32px]">
              <Warehouse />
              เข้าสู่ระบบ
            </p>
            <FormInput
              register={register}
              name="email"
              type="email"
              label={
                <div className="flex items-center gap-2">
                  <Mail className="text-primary h-5 w-5" />
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
                  <Lock className="text-primary h-5 w-5" />
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
              className="bg-gradient-primary ml-0 w-full"
            />
          </form>
        </div>
      </div>
    </div>
  );
};
export default Login;
