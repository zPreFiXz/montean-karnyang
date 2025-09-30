import DropdownListMenu from "./DropdownListMenu";
import Logo from "./Logo";

const Navbar = () => {
  return (
    <div className="hidden xl:flex justify-between items-center w-full h-[73px] pl-[43px] pr-[24px] shadow-primary">
      <Logo />
      <DropdownListMenu />
    </div>
  );
};
export default Navbar;
