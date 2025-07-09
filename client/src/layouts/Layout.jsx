import { Outlet } from "react-router";
import Navbar from "../components/navbar/Navbar";
import LeftSidebar from "../components/LeftSidebar";
import Tab from "@/components/Tab";

const Layout = () => {
  return (
    <div className="font-athiti">
      <Navbar />
      <div className="lg:flex">
        <LeftSidebar />
        <Outlet />
        <div className="z-50 lg:hidden fixed bottom-0 left-0 right-0">
          <Tab />
        </div>
      </div>
    </div>
  );
};
export default Layout;
