import { Link } from "react-router";
import { Garage } from "../icons/Icons";

const Logo = () => {
  return (
    <Link to="/dashboard" className="flex items-center gap-[8px]">
      <Garage />
      <p className="font-semibold text-[22px] text-primary">มณเฑียรการยาง</p>
    </Link>
  );
};
export default Logo;
