import { Link } from "react-router";
import { Garage } from "../icons/Icons";

const Logo = () => {
  return (
    <Link to="/dashboard" className="flex items-center gap-[8px]">
      <Garage />
      <p className="text-primary text-[22px] font-semibold">มณเฑียรการยาง</p>
    </Link>
  );
};
export default Logo;
