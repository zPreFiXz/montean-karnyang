import { Outlet } from "react-router";
import Navbar from "@/components/navbar/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import BottomNav from "@/components/BottomNav";

// breakpoint เดียวทั้งระบบ: จอ lg ขึ้นไปใช้ Navbar + Sidebar, ต่ำกว่านั้นใช้ BottomNav
const Layout = () => {
  return (
    <div className="font-athiti flex min-h-screen flex-col">
      <div className="sticky top-0 z-40 hidden w-full bg-transparent lg:block">
        <Navbar />
      </div>

      <div className="flex-1 lg:flex lg:overflow-hidden">
        <div className="sticky top-[73px] hidden self-start lg:block">
          <LeftSidebar />
        </div>

        <main className="bg-surface-muted flex-1 lg:max-h-[calc(100vh-73px)] lg:overflow-y-auto">
          <Outlet />
        </main>

        <div className="fixed right-0 bottom-0 left-0 z-50 lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
};
export default Layout;
