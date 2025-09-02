import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { CircleUserRound, LogOut, Settings, ChevronDown } from "lucide-react";
import useAuthStore from "@/stores/authStore";
import { useNavigate } from "react-router";

const DropdownListMenu = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="group flex items-center gap-[12px] px-[12px] py-[8px] rounded-[10px] hover:opacity-90 cursor-pointer">
          <div className="relative">
            <div className="flex justify-center items-center w-[40px] h-[41px] rounded-full bg-gradient-to-br from-primary to-[#8663f8] shadow-md">
              <CircleUserRound className="text-surface" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-[12px] h-[12px] rounded-full border-2 border-surface bg-green-500 shadow-md"></div>
          </div>
          <div className="flex flex-col">
            <p className="font-semibold text-[16px] text-primary leading-tight">
              ภาคภูมิ สุขชาติ
            </p>
            <p className="font-medium text-[12px] text-subtle-light leading-tight">
              ผู้ดูแลระบบ
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
        <div className="px-[12px] py-[8px] mb-[4px]">
          <p className="font-semibold text-[14px] text-subtle-dark">
            ภาคภูมิ สุขชาติ
          </p>
          <p className="font-medium text-[12px] text-subtle-light">
            admin@montean.com
          </p>
        </div>
        <DropdownMenuSeparator className="my-[4px]" />
        <DropdownMenuItem className="flex items-center gap-[12px] px-[12px] py-[8px] rounded-[8px] font-medium text-[14px] hover:bg-surface/50 focus:bg-surface/50 duration-200 cursor-pointer">
          <CircleUserRound className="w-[16px] h-[16px]" />
          <span>โปรไฟล์</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-[12px] px-[12px] py-[8px] rounded-[8px] font-medium text-[14px] hover:bg-surface/50 focus:bg-surface/50 duration-200 cursor-pointer">
          <Settings className="w-[16px] h-[16px]" />
          <span>การตั้งค่า</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-[4px]" />
        <DropdownMenuItem
          onClick={() => {
            handleLogout();
          }}
          className="flex items-center gap-[12px] px-[12px] py-[8px] rounded-[8px] font-medium text-[14px] hover:text-red-600 focus:text-red-600 hover:bg-red-50 focus:bg-red-50 duration-200 cursor-pointer"
        >
          <LogOut className="w-[16px] h-[16px]" />
          <span>ออกจากระบบ</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default DropdownListMenu;
