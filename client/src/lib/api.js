import useAuthStore from "@/stores/useAuthStore";
import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (window.location.pathname !== "/login" && !isRedirecting) {
        isRedirecting = true;
        useAuthStore.getState().clearAuth();
        toast.error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่", {
          duration: 2000,
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
