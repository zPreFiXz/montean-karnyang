import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { LoaderCircle, LogOut } from "lucide-react";
import useAuthStore from "@/stores/useAuthStore";
import { useNavigate } from "react-router";
import { useState } from "react";
import { toast } from "sonner";

const SignOutLink = ({ onLoggingOut }) => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    onLoggingOut?.(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await logout();
      toast.success("ออกจากระบบเรียบร้อยแล้ว");
      navigate("/login");
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoggingOut(false);
      onLoggingOut?.(false);
    }
  };

  return (
    <DropdownMenuItem
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex cursor-pointer items-center gap-[12px] rounded-[8px] px-[12px] py-[8px] text-[16px] font-medium transition-colors duration-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoggingOut ? (
        <LoaderCircle className="text-destructive h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="text-destructive h-4 w-4" />
      )}
      <p>{isLoggingOut ? "ออกจากระบบ..." : "ออกจากระบบ"}</p>
    </DropdownMenuItem>
  );
};
export default SignOutLink;
