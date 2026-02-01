import useAuthStore from "@/stores/authStore";
import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // ไม่ redirect ถ้าอยู่หน้า login อยู่แล้ว
      if (window.location.pathname !== "/login") {
        // ใช้ clearAuth (sync) แทน logout เพราะ cookie ที่ server ก็ invalid อยู่แล้ว
        useAuthStore.getState().clearAuth();
        toast.error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
