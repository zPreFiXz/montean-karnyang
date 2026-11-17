import { Link, useNavigate } from "react-router";
import { Car, Gauge, MapPinOff, Package, Settings, Wrench } from "lucide-react";
import useAuthStore from "@/stores/useAuthStore";

// อยู่นอกโครงหน้าหลัก (ไม่มีแถบเมนู) จึงแต่งแบบเดียวกับหน้าเข้าสู่ระบบ
const NotFound = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  // เปิดลิงก์ตรงๆ ไม่มีหน้าก่อนหน้าให้ย้อน
  const canGoBack = window.history.state?.idx > 0;

  return (
    <div className="font-athiti bg-surface relative min-h-svh p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <Wrench className="text-primary/15 absolute top-1 left-4 h-20 w-20 rotate-12" />
        <Car className="text-primary/15 absolute bottom-25 left-4 h-20 w-20 rotate-3" />
        <Settings className="text-primary/15 absolute right-6 bottom-15 h-22 w-22 rotate-45" />
        <Gauge className="text-primary/15 absolute top-29 right-10 h-16 w-16 rotate-6" />
        <Package className="text-primary/15 absolute bottom-55 left-40 h-20 w-20 -rotate-6" />
      </div>
      <div className="relative z-20 mt-6 flex w-full flex-col items-center">
        <img
          src="/logo.png"
          alt="มณเฑียรการยาง"
          className="mb-12 h-19 w-auto md:h-26"
        />
        <div className="bg-surface shadow-primary flex w-full flex-col items-center rounded-3xl p-6 text-center md:max-w-125">
          <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
            <MapPinOff className="text-primary h-8 w-8" />
          </div>
          <h1 className="text-primary mt-4 text-3xl font-semibold text-balance md:text-[32px]">
            ไม่พบหน้าที่คุณต้องการ
          </h1>
          <p className="text-subtle-dark mt-2 text-lg font-medium text-balance md:text-xl">
            ลิงก์อาจไม่ถูกต้อง หรือหน้านี้ถูกลบไปแล้ว
          </p>
          <Link
            to={token ? "/dashboard" : "/login"}
            replace
            className="text-surface bg-gradient-primary shadow-primary mt-6 flex h-[41px] w-full items-center justify-center rounded-[20px] text-lg font-semibold md:text-xl"
          >
            {token ? "กลับหน้าหลัก" : "ไปหน้าเข้าสู่ระบบ"}
          </Link>
          {canGoBack && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-primary mt-4 cursor-pointer text-lg font-semibold md:text-xl"
            >
              ย้อนกลับ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
