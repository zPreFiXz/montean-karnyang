import DropdownListMenu from "./DropdownListMenu";
import NavbarStats from "./NavbarStats";
import Logo from "./Logo";

const Navbar = () => {
  return (
    <div className="shadow-primary relative hidden h-[73px] w-full items-center justify-between pr-[24px] pl-[43px] xl:flex">
      <Logo />
      <NavbarStats />
      <DropdownListMenu />
    </div>
  );
};
export default Navbar;
