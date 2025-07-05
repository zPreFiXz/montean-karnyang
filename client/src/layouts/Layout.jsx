import { Outlet } from "react-router";
import Navbar from "../components/navbar/Navbar";
import LeftSidebar from "../components/LeftSidebar";

const Layout = () => {
  return (
    <div className="font-athiti">
      <Navbar />
      <div className="flex">
        <LeftSidebar />
        <Outlet />
      </div>
    </div>
  );
};
export default Layout;
