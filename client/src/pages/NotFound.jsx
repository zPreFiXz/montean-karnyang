import { Link } from "react-router";

const NotFound = () => {
  return (
    <div className="font-athiti flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-primary text-7xl font-bold">404</p>
      <p className="text-subtle-dark text-xl">ไม่พบหน้าที่คุณต้องการ</p>
      <Link
        to="/dashboard"
        className="bg-gradient-primary text-surface rounded-[10px] px-6 py-3 text-lg font-medium duration-300 hover:opacity-90"
      >
        กลับหน้าหลัก
      </Link>
    </div>
  );
};

export default NotFound;
