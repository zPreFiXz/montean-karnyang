import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import useAuthStore from "@/stores/useAuthStore";
import { Link } from "react-router";
import { useState } from "react";
import { MANAGEMENT_LINKS, ADMIN_LINKS } from "@/constants/menu";
import { roleLabel } from "@/utils/role";
import SignOutLink from "@/components/navigation/SignOutLink";
import UserIcon from "@/components/navigation/UserIcon";

const UserMenu = () => {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => !isLoggingOut && setIsOpen(open)}
    >
      <DropdownMenuTrigger asChild>
        <div className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2">
          <div className="relative">
            <UserIcon />
          </div>
          <div className="flex flex-col">
            <p className="text-primary text-lg leading-tight font-semibold">
              {user?.name}
            </p>
            <p className="text-subtle-dark text-sm leading-tight font-medium">
              {roleLabel(user?.role)}
            </p>
          </div>
          <Button
            variant="outline"
            className="h-8 w-8 cursor-pointer transition-transform duration-300 group-data-[state=open]:rotate-180"
          >
            <ChevronDown className="text-primary h-4 w-4" />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="font-athiti bg-surface w-55 rounded-lg border border-gray-100 p-2 shadow-[0px_10px_40px_0_rgba(0,0,0,0.15)]">
        {MANAGEMENT_LINKS.map((item, index) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={index} asChild>
              <Link
                to={item.href}
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors duration-200 hover:bg-gray-100"
              >
                <Icon className={`h-4 w-4 ${item.iconClass}`} />
                <p>{item.label}</p>
              </Link>
            </DropdownMenuItem>
          );
        })}

        {user?.role === "ADMIN" &&
          ADMIN_LINKS.map((item, index) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem key={index} asChild>
                <Link
                  to={item.href}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors duration-200 hover:bg-gray-100"
                >
                  <Icon className={`h-4 w-4 ${item.iconClass}`} />
                  <p>{item.label}</p>
                </Link>
              </DropdownMenuItem>
            );
          })}
        <DropdownMenuSeparator className="my-1" />

        <SignOutLink onLoggingOut={setIsLoggingOut} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default UserMenu;
