import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import {
  CircleUserRound,
  LogOut,
  CarFront,
  Users,
  ChevronDown,
  LoaderCircle,
} from "lucide-react";
import useAuthStore from "@/stores/authStore";
import { useNavigate } from "react-router";
import { useState } from "react";
import { TIMING } from "@/utils/constants";
import { toast } from "sonner";

const DropdownListMenu = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { user } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await new Promise((resolve) => setTimeout(resolve, TIMING.LOADING_DELAY));
    await logout();
    toast.success("ออกจากระบบเรียบร้อยแล้ว");
    navigate("/login");
  };

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => !isLoggingOut && setIsOpen(open)}
    >
      <DropdownMenuTrigger asChild>
        <div className="group flex cursor-pointer items-center gap-[12px] rounded-[10px] px-[12px] py-[8px]">
          <div className="relative">
            <div className="bg-gradient-primary flex h-[41px] w-[40px] items-center justify-center rounded-full shadow-md">
              <CircleUserRound className="text-surface" />
            </div>
          </div>
          <div className="flex flex-col">
            <p className="text-primary text-[18px] leading-tight font-semibold">
              {user?.fullName}
            </p>
            <p className="text-subtle-dark text-[14px] leading-tight font-medium">
              {user?.role === "ADMIN" ? "แอดมิน" : user?.role ? "พนักงาน" : ""}
            </p>
          </div>
          <Button
            variant="outline"
            className="h-[32px] w-[32px] cursor-pointer transition-transform duration-300 group-data-[state=open]:rotate-180"
          >
            <ChevronDown className="text-primary h-[16px] w-[16px]" />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="font-athiti bg-surface w-[220px] rounded-[12px] border border-gray-100 p-[8px] shadow-[0px_10px_40px_0_rgba(0,0,0,0.15)]"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuItem
          onClick={() => navigate("/vehicles/brand-models")}
          className="flex cursor-pointer items-center gap-[12px] rounded-[8px] px-[12px] py-[8px] text-[16px] font-medium transition-colors duration-200 hover:bg-gray-100"
        >
          <CarFront className="text-primary h-[16px] w-[16px]" />
          <p>จัดการยี่ห้อและรุ่นรถ</p>
        </DropdownMenuItem>
        {user?.role === "ADMIN" && (
          <DropdownMenuItem
            onClick={() => navigate("/admin/employees")}
            className="flex cursor-pointer items-center gap-[12px] rounded-[8px] px-[12px] py-[8px] text-[16px] font-medium transition-colors duration-200 hover:bg-gray-100"
          >
            <Users className="text-completed h-[16px] w-[16px]" />
            <p>จัดการบัญชีพนักงาน</p>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="my-[4px]" />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex cursor-pointer items-center gap-[12px] rounded-[8px] px-[12px] py-[8px] text-[16px] font-medium transition-colors duration-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoggingOut ? (
            <LoaderCircle className="text-delete h-[16px] w-[16px] animate-spin" />
          ) : (
            <LogOut className="text-delete h-[16px] w-[16px]" />
          )}
          <p>{isLoggingOut ? "ออกจากระบบ..." : "ออกจากระบบ"}</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default DropdownListMenu;
