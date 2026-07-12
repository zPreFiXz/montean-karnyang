import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import apiClient from "@/api/apiClient";

const authStore = (set) => ({
  user: null,
  token: null,

  login: async (form) => {
    const res = await apiClient.post("/login", form);
    set({
      user: res.data.payload,
      token: res.data.token,
    });
    return res;
  },
  logout: async () => {
    try {
      await apiClient.post("/logout");
    } catch {
      // แจ้ง server ไม่สำเร็จก็ไม่เป็นไร ล้าง session ฝั่ง client ต่อได้เลย
    }
    set({ user: null, token: null });
  },
  clearAuth: () => set({ user: null, token: null }),
});

const persistOptions = {
  name: "auth-store",
  storage: createJSONStorage(() => localStorage),
};

const useAuthStore = create(persist(authStore, persistOptions));

export default useAuthStore;
