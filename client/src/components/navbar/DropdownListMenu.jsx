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
} from "lucide-react";
import useAuthStore from "@/stores/authStore";
import { useNavigate } from "react-router";

const DropdownListMenu = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { user } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="group flex items-center gap-[12px] px-[12px] py-[8px] rounded-[10px] cursor-pointer">
          <div className="relative">
            <div className="flex justify-center items-center w-[40px] h-[41px] rounded-full bg-gradient-primary shadow-md">
              <CircleUserRound className="text-surface" />
            </div>
          </div>
          <div className="flex flex-col">
            <p className="font-semibold text-[18px] text-primary leading-tight">
              {user?.fullName}
            </p>
            <p className="font-medium text-[14px] text-subtle-dark leading-tight">
              {user?.role === "ADMIN" ? "แอดมิน" : user?.role ? "พนักงาน" : ""}
            </p>
          </div>
          <Button
            variant="outline"
            className="h-[32px] w-[32px] group-data-[state=open]:rotate-180 duration-300 cursor-pointer"
          >
            <ChevronDown className="w-[16px] h-[16px] text-primary group-data-[state=open]:rotate-360 duration-300" />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[220px] p-[8px] rounded-[12px] border border-gray-100 font-athiti  bg-white shadow-[0px_10px_40px_0_rgba(0,0,0,0.15)]"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuItem
          onClick={() => navigate("/vehicle-brand-models")}
          className="flex items-center gap-[12px] px-[12px] py-[8px] rounded-[8px] font-medium text-[16px] focus:bg-surface/50 duration-300 cursor-pointer"
        >
          <CarFront className="w-[16px] h-[16px]" />
          <p>ยี่ห้อและรุ่นรถ</p>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate("/admin/employees")}
          className="flex items-center gap-[12px] px-[12px] py-[8px] rounded-[8px] font-medium text-[16px] focus:bg-surface/50 duration-300 cursor-pointer"
        >
          <Users className="w-[16px] h-[16px]" />
          <p>บัญชีพนักงาน</p>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-[4px]" />
        <DropdownMenuItem
          onClick={() => {
            handleLogout();
          }}
          className="flex items-center gap-[12px] px-[12px] py-[8px] rounded-[8px] font-medium text-[16px] duration-300 cursor-pointer"
        >
          <LogOut className="w-[16px] h-[16px]" />
          <p>ออกจากระบบ</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default DropdownListMenu;
