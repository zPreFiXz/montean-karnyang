import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { LoaderCircle, LogOut } from "lucide-react";
import useAuthStore from "@/stores/useAuthStore";
import { useNavigate } from "react-router";
import { useState } from "react";
import { toast } from "sonner";
import { toastError } from "@/utils/handleError";

const SignOutLink = ({ onLoggingOut }) => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    onLoggingOut?.(true);
    try {
      await logout();
      toast.success("ออกจากระบบเรียบร้อยแล้ว");
      navigate("/login");
    } catch (error) {
      toastError(error);
    } finally {
      setIsLoggingOut(false);
      onLoggingOut?.(false);
    }
  };

  return (
    <DropdownMenuItem
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="text-destructive focus:text-destructive flex h-11 cursor-pointer items-center gap-3 rounded-md px-2 text-lg font-medium focus:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="bg-destructive/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
        {isLoggingOut ? (
          <LoaderCircle className="text-destructive h-4.5 w-4.5 animate-spin" />
        ) : (
          <LogOut className="text-destructive h-4.5 w-4.5" />
        )}
      </span>
      {isLoggingOut ? "ออกจากระบบ..." : "ออกจากระบบ"}
    </DropdownMenuItem>
  );
};
export default SignOutLink;
