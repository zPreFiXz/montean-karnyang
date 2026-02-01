import api from "@/lib/api";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const authStore = (set) => ({
  user: null,

  // สำหรับ login (async)
  actionLogin: async (form) => {
    const res = await api.post("/api/login", form);

    set({
      user: res.data.payload,
    });
    return res;
  },

  // สำหรับ clear state เฉยๆ (sync) - ใช้ใน 401 interceptor
  clearAuth: () => {
    set({ user: null });
  },

  // สำหรับ logout ปกติ (async) - เรียก API ด้วย
  logout: async () => {
    try {
      await api.post("/api/logout");
    } catch {
      // ถ้า logout API fail ก็ไม่เป็นไร clear state อย่างเดียว
    }
    set({ user: null });
  },
});

const usePersist = {
  name: "auth",
  storage: createJSONStorage(() => localStorage),
};

const useAuthStore = create(persist(authStore, usePersist));

export default useAuthStore;
