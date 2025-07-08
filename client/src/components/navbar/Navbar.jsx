import DropdownListMenu from "./DropdownListMenu";
import Logo from "./Logo";

const Navbar = () => {
  return (
    <div className="hidden lg:flex justify-between items-center w-full h-[73px] pl-[43px] pr-[24px] shadow-[0px_0px_50px_0_rgba(0,0,0,0.1)]">
      <Logo />
      <DropdownListMenu />
    </div>
  );
};
export default Navbar;
