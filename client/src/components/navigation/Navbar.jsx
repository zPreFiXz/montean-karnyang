import UserMenu from "@/components/navigation/UserMenu";
import NavbarStats from "@/components/navigation/NavbarStats";
import Logo from "@/components/navigation/Logo";

// โลโก้อยู่ในช่องกว้างเท่าเมนูข้าง ข้อมูลวันนี้กับผู้ใช้รวมกลุ่มชิดขวา
const Navbar = () => {
  return (
    <header className="shadow-primary bg-surface relative hidden h-[73px] w-full items-center xl:flex">
      <div className="flex w-64 shrink-0 items-center px-5">
        <Logo />
      </div>
      <div className="flex flex-1 items-center justify-end gap-4 pr-6">
        <NavbarStats />
        <div className="bg-subtle-light/40 h-8 w-px" />
        <UserMenu />
      </div>
    </header>
  );
};
export default Navbar;
