import axios from "axios";
import { toast } from "sonner";
import useAuthStore from "@/stores/useAuthStore";

// axios instance กลาง: ใส่ token ให้อัตโนมัติ และจัดการ session หมดอายุที่เดียว
// prod: เว็บถูกเสิร์ฟจาก server เดียวกับ API → เรียกแบบ same-origin ด้วย path relative
// dev: Vite proxy /api ไปหา Express (ดู vite.config.js) จึงใช้ "/api" ได้ทั้งสองโหมด
const apiClient = axios.create({
  baseURL: "/api",
});

// เครื่องมือตรวจงานระหว่างพัฒนา: หน่วงคำขอทุกอันเพื่อดูสถานะกำลังโหลดของแต่ละหน้าได้นานพอจะเทียบกัน
// เปิดด้วย VITE_API_DELAY_MS=999999 npm run dev — ปิดสนิทใน production เพราะ import.meta.env.DEV เป็น false
const apiDelayMs = import.meta.env.DEV
  ? Number(import.meta.env.VITE_API_DELAY_MS) || 0
  : 0;

apiClient.interceptors.request.use(async (config) => {
  if (apiDelayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, apiDelayMs));
  }

  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let sessionExpiredNotified = false;

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isLoginRequest = error.config?.url?.includes("/login");

    // token หมดอายุ/ถูกเพิกถอน → ล้าง session แล้วพากลับหน้า login
    if (status === 401 && !isLoginRequest) {
      const { token, clearAuth } = useAuthStore.getState();
      if (token) {
        clearAuth();
        if (!sessionExpiredNotified) {
          sessionExpiredNotified = true;
          toast.error(
            error.response?.data?.message ||
              "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
          );
          setTimeout(() => {
            sessionExpiredNotified = false;
          }, 3000);
        }
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
