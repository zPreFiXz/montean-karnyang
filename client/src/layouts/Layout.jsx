import { Suspense } from "react";
import { Outlet } from "react-router";
import { LoaderCircle } from "lucide-react";
import Navbar from "@/components/navbar/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import BottomNav from "@/components/BottomNav";

// breakpoint เดียวทั้งระบบ: จอ lg ขึ้นไปใช้ Navbar + Sidebar, ต่ำกว่านั้นใช้ BottomNav
const Layout = () => {
  return (
    <div className="font-athiti flex min-h-svh flex-col">
      <div className="sticky top-0 z-40 hidden w-full bg-transparent lg:block">
        <Navbar />
      </div>

      <div className="flex-1 lg:flex lg:overflow-hidden">
        <div className="sticky top-[73px] hidden self-start lg:block">
          <LeftSidebar />
        </div>

        {/* Suspense อยู่ตรงนี้ ไม่ใช่ครอบทั้ง <Routes> ไม่งั้นตอนโหลดโค้ดของหน้า
            โครงหน้า (navbar, แท็บล่าง) จะถูกล้างทิ้งแล้วโผล่กลับมา เห็นเป็นกระพริบ */}
        <main className="bg-surface-muted flex min-h-svh flex-1 flex-col lg:max-h-[calc(100vh-73px)] lg:min-h-0 lg:overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex flex-1 items-center justify-center">
                <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>

        {/* ตั้งชื่อ view transition ไว้ ไม่งั้นแท็บล่างจะถูกรวมอยู่ในภาพนิ่งของทั้งหน้า
            ซึ่งวางตามตำแหน่งในหน้าที่เลื่อนได้ ไม่ใช่ตำแหน่ง fixed จริง แล้วจะกระตุกทุกครั้งที่มี transition */}
        <div
          style={{ viewTransitionName: "bottom-nav" }}
          className="fixed right-0 bottom-0 left-0 z-50 lg:hidden"
        >
          <BottomNav />
        </div>
      </div>
    </div>
  );
};
export default Layout;
