import { Link } from "react-router";

// โลโก้จริงของร้าน (รูปเดียวกับหน้าเข้าสู่ระบบ) สัดส่วนกว้างเกือบ 5 เท่าของความสูง
const Logo = () => {
  return (
    <Link to="/dashboard" aria-label="ไปหน้าหลัก" className="flex items-center">
      <img
        src="/logo.png"
        alt="มณเฑียรการยาง"
        className="h-11 w-auto"
        draggable={false}
      />
    </Link>
  );
};
export default Logo;
