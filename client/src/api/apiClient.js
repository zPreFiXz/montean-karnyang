import axios from "axios";
import { toast } from "sonner";
import useAuthStore from "@/stores/useAuthStore";

// axios instance กลาง: ใส่ token ให้อัตโนมัติ และจัดการ session หมดอายุที่เดียว
const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

apiClient.interceptors.request.use((config) => {
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
            error.response?.data?.message || "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
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
