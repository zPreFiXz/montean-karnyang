import Logo from "./Logo";
import UserIcon from "./UserIcon";

const Navbar = () => {
  return (
    <div
      className="hidden lg:flex justify-between items-center w-full h-[73px] pl-[43px] pr-[24px]"
      style={{ boxShadow: "0px 0px 50px 0 rgba(0,0,0,0.1)" }}
    >
      <Logo />
      <UserIcon />
    </div>
  );
};
export default Navbar;
