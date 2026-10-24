import UserMenu from "@/components/navigation/UserMenu";
import NavbarStats from "@/components/navigation/NavbarStats";
import Logo from "@/components/navigation/Logo";

const Navbar = () => {
  return (
    <header className="shadow-primary relative hidden h-[73px] w-full items-center justify-between pr-6 pl-10 lg:flex">
      <Logo />
      <NavbarStats />
      <UserMenu />
    </header>
  );
};
export default Navbar;
