import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { ChevronDown } from "lucide-react";
import useAuthStore from "@/stores/useAuthStore";
import { Link } from "react-router";
import { useState } from "react";
import { publicLinks, privateLinks } from "@/utils/links";
import SignOutLink from "./SignOutLink";
import UserIcon from "./UserIcon";

const DropdownListMenu = () => {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => !isLoggingOut && setIsOpen(open)}
    >
      <DropdownMenuTrigger asChild>
        <div className="group flex cursor-pointer items-center gap-[12px] rounded-[10px] px-[12px] py-[8px]">
          <div className="relative">
            <UserIcon />
          </div>

          {/* ชื่อและบทบาทของผู้ใช้ */}
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
            <ChevronDown className="text-primary h-4 w-4" />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="font-athiti bg-surface w-[220px] rounded-[12px] border border-gray-100 p-[8px] shadow-[0px_10px_40px_0_rgba(0,0,0,0.15)]">
        {publicLinks.map((item, index) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={index} asChild>
              <Link
                to={item.href}
                className="flex cursor-pointer items-center gap-[12px] rounded-[8px] px-[12px] py-[8px] text-[16px] font-medium transition-colors duration-200 hover:bg-gray-100"
              >
                <Icon className={`h-4 w-4 ${item.iconClass}`} />
                <p>{item.label}</p>
              </Link>
            </DropdownMenuItem>
          );
        })}

        {/* Private Links เฉพาะ ADMIN */}
        {user?.role === "ADMIN" &&
          privateLinks.map((item, index) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem key={index} asChild>
                <Link
                  to={item.href}
                  className="flex cursor-pointer items-center gap-[12px] rounded-[8px] px-[12px] py-[8px] text-[16px] font-medium transition-colors duration-200 hover:bg-gray-100"
                >
                  <Icon className={`h-4 w-4 ${item.iconClass}`} />
                  <p>{item.label}</p>
                </Link>
              </DropdownMenuItem>
            );
          })}
        <DropdownMenuSeparator className="my-[4px]" />

        {/* ออกจากระบบ */}
        <SignOutLink onLoggingOut={setIsLoggingOut} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default DropdownListMenu;
