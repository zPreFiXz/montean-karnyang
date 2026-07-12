import DropdownListMenu from "./DropdownListMenu";
import NavbarStats from "./NavbarStats";
import Logo from "./Logo";

const Navbar = () => {
  return (
    <header className="shadow-primary relative hidden h-[73px] w-full items-center justify-between pr-6 pl-10 lg:flex">
      <Logo />
      <NavbarStats />
      <DropdownListMenu />
    </header>
  );
};
export default Navbar;
