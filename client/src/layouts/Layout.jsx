import { Outlet } from "react-router";
import Navbar from "@/components/navbar/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import Tab from "@/components/Tab";

const Layout = () => {
  return (
    <div className="font-athiti flex min-h-screen flex-col">
      <div className="z-40 w-full">
        <div className="sticky top-0 hidden bg-transparent lg:block">
          <Navbar />
        </div>
        <div className="lg:hidden">
          <Navbar />
        </div>
      </div>

      <div className="flex-1 lg:flex lg:overflow-hidden">
        <div className="sticky top-[73px] hidden self-start lg:block">
          <LeftSidebar />
        </div>

        <main className="bg-gradient-primary flex-1 lg:overflow-y-auto xl:max-h-[calc(100vh-73px)]">
          <Outlet />
        </main>

        <div className="fixed right-0 bottom-0 left-0 z-50 xl:hidden">
          <Tab />
        </div>
      </div>
    </div>
  );
};
export default Layout;
