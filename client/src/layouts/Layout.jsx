import { Suspense } from "react";
import { Outlet } from "react-router";
import { LoaderCircle } from "lucide-react";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import BottomNav from "@/components/navigation/BottomNav";
import { usePageResetKey } from "@/hooks/usePageReset";

const Layout = () => {
  const resetKey = usePageResetKey();

  return (
    <div className="font-athiti flex min-h-svh flex-col">
      <div className="sticky top-0 z-40 hidden w-full bg-transparent xl:block">
        <Navbar />
      </div>

      <div className="flex-1 xl:flex xl:overflow-hidden">
        <div className="sticky top-[73px] hidden self-start xl:block">
          <Sidebar />
        </div>

        {/* Suspense อยู่ตรงนี้ ไม่ครอบทั้ง <Routes> ไม่งั้นโครงหน้าจะถูกล้างแล้วโผล่กลับตอนโหลดโค้ด */}
        {/* จอคอม main สูงจำกัดแล้วเลื่อนในตัว กล่องหน้าไม่ให้หด ไม่งั้นถูกบีบเหลือ min-h-svh แล้วเนื้อหาล้นกล่อง */}
        <main className="bg-surface-muted flex min-h-svh flex-1 flex-col xl:max-h-[calc(100vh-73px)] xl:min-h-0 xl:overflow-y-auto xl:[&>*]:shrink-0">
          <Suspense
            fallback={
              <div className="flex flex-1 items-center justify-center">
                <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
              </div>
            }
          >
            <Outlet key={resetKey} />
          </Suspense>
        </main>

        {/* ตั้งชื่อ view transition ไว้ ไม่งั้นแท็บล่างจะกระตุกทุกครั้งที่มี transition */}
        <div
          style={{ viewTransitionName: "bottom-nav" }}
          className="fixed right-0 bottom-0 left-0 z-50 xl:hidden"
        >
          <BottomNav />
        </div>
      </div>
    </div>
  );
};
export default Layout;
