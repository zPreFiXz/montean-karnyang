import { Outlet } from "react-router";
import Navbar from "../components/navbar/Navbar";
import LeftSidebar from "../components/LeftSidebar";
import Tab from "@/components/Tab";

const Layout = () => {
  return (
    <div className="font-athiti min-h-screen flex flex-col">
      <div className="w-full z-40">
        <div className="hidden lg:block sticky top-0 bg-transparent">
          <Navbar />
        </div>
        <div className="lg:hidden">
          <Navbar />
        </div>
      </div>

      <div className="flex-1 lg:flex lg:overflow-hidden">
        <div className="hidden lg:block sticky top-[73px] self-start">
          <LeftSidebar />
        </div>

        <main className="flex-1 xl:max-h-[calc(100vh-73px)] lg:overflow-y-auto">
          <Outlet />
        </main>

        <div className="z-50 xl:hidden fixed bottom-0 left-0 right-0">
          <Tab />
        </div>
      </div>
    </div>
  );
};
export default Layout;
