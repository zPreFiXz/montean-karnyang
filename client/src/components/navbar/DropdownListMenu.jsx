import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { ChevronDown } from "lucide-react";

const DropdownListMenu = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer" asChild>
        <Button>
          <ChevronDown className="text-white" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="font-athiti text-subtle-dark">
        <DropdownMenuLabel className="text-[16px]">
          บัญชีของฉัน
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-[16px] cursor-pointer">
          โปรไฟล์
        </DropdownMenuItem>
        <DropdownMenuItem className="text-[16px] cursor-pointer">
          ออกจากระบบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default DropdownListMenu;
