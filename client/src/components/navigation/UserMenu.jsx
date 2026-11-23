import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import useAuthStore from "@/stores/useAuthStore";
import { Link } from "react-router";
import { useRef, useState } from "react";
import { MANAGEMENT_LINKS, ADMIN_LINKS } from "@/constants/menu";
import { roleLabel } from "@/utils/role";
import SignOutLink from "@/components/navigation/SignOutLink";
import UserIcon from "@/components/navigation/UserIcon";

// ไอคอนในกล่องสีแบบเมนูบนมือถือ (tileClass ชุดเดียวกัน) ย่อให้พอดีกับแถวในเมนู
const MenuLink = ({ item }) => {
  const Icon = item.icon;
  return (
    // คลาสอยู่ที่ตัวเมนู ไม่ใช่ลิงก์ เพราะ asChild ต่อคลาสเฉยๆ ไม่ได้รวมแบบตัดซ้ำ text-sm ตั้งต้นจะชนะ
    <DropdownMenuItem
      asChild
      className="text-normal flex h-11 cursor-pointer items-center gap-3 rounded-md px-2 text-lg font-medium"
    >
      <Link to={item.href}>
        <span
          className={`${item.tileClass} flex h-8 w-8 shrink-0 items-center justify-center rounded-lg`}
        >
          <Icon className="text-surface h-4.5 w-4.5" />
        </span>
        {item.label}
      </Link>
    </DropdownMenuItem>
  );
};

const GroupLabel = ({ children }) => (
  <DropdownMenuLabel className="text-subtle-light px-2 pt-2 pb-1 text-sm font-medium">
    {children}
  </DropdownMenuLabel>
);

const UserMenu = () => {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isAdmin = user?.role === "ADMIN";
  // ปิดด้วยเมาส์ไม่ต้องคืนโฟกัสให้ปุ่ม ไม่งั้นเบราว์เซอร์วาดกรอบโฟกัสค้างไว้ ปิดด้วย Esc ยังคืนให้คนใช้คีย์บอร์ด
  const closedByPointerRef = useRef(false);

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => !isLoggingOut && setIsOpen(open)}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`เมนูผู้ใช้ ${user?.name || ""}`.trim()}
          onPointerDown={() => {
            if (isOpen) closedByPointerRef.current = true;
          }}
          className="group focus-visible:ring-primary/40 flex cursor-pointer items-center gap-3 rounded-lg py-1.5 pr-2 pl-1.5 text-left duration-200 outline-none hover:bg-gray-100 focus-visible:ring-2 data-[state=open]:bg-gray-100"
        >
          <UserIcon />
          <div className="flex flex-col">
            <p className="text-normal text-lg leading-tight font-semibold">
              {user?.name}
            </p>
            <p className="text-subtle-dark text-sm leading-tight font-medium">
              {roleLabel(user?.role)}
            </p>
          </div>
          <ChevronDown className="text-subtle-dark h-5 w-5 duration-300 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        onPointerDownOutside={() => {
          closedByPointerRef.current = true;
        }}
        onPointerDown={() => {
          closedByPointerRef.current = true;
        }}
        onCloseAutoFocus={(e) => {
          if (closedByPointerRef.current) e.preventDefault();
          closedByPointerRef.current = false;
        }}
        className="font-athiti bg-surface w-72 rounded-lg border border-gray-100 p-2 shadow-[0px_10px_40px_0_rgba(0,0,0,0.15)]"
      >
        {/* บอกว่ากำลังใช้บัญชีไหน เครื่องในร้านใช้ร่วมกันหลายคน */}
        <div className="flex items-center gap-3 px-2 py-2">
          <UserIcon />
          <div className="min-w-0">
            <p className="text-normal truncate text-lg leading-tight font-semibold">
              {user?.name}
            </p>
            <p className="text-subtle-dark truncate text-sm leading-tight font-medium">
              {user?.email || roleLabel(user?.role)}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator className="my-1" />

        <GroupLabel>จัดการข้อมูล</GroupLabel>
        {MANAGEMENT_LINKS.map((item) => (
          <MenuLink key={item.href} item={item} />
        ))}

        {isAdmin && (
          <>
            <GroupLabel>ผู้ดูแลระบบ</GroupLabel>
            {ADMIN_LINKS.map((item) => (
              <MenuLink key={item.href} item={item} />
            ))}
          </>
        )}

        <DropdownMenuSeparator className="my-1" />
        <SignOutLink onLoggingOut={setIsLoggingOut} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default UserMenu;
