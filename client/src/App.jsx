import { Toaster } from "sonner";
import AppRoutes from "@/routes/AppRoutes";

const App = () => {
  return (
    <>
      <AppRoutes />
      <Toaster
        richColors
        position="top-center"
        expand={false}
        duration={3000}
        // จอใหญ่กว้างกว่าค่าเริ่มต้น (356px) ข้อความกับปุ่มเลิกทำอยู่บรรทัดเดียวได้ จอมือถือเต็มจอเหมือนเดิม
        style={{ "--width": "400px" }}
        toastOptions={{
          style: {
            fontFamily: '"Athiti", sans-serif',
            fontSize: "20px",
            fontWeight: "500",
          },
          // ปุ่มในแจ้งเตือน (เช่น เลิกทำ) แบบปุ่มขอบมนของระบบ กรอบกับตัวหนังสือใช้สีตามแจ้งเตือน
          actionButtonStyle: {
            background: "transparent",
            color: "inherit",
            border: "1.5px solid currentColor",
            borderRadius: "999px",
            fontFamily: '"Athiti", sans-serif',
            fontSize: "15px",
            fontWeight: "600",
            height: "28px",
            padding: "0 8px",
            gap: "3px",
          },
        }}
      />
    </>
  );
};
export default App;
