import api from "@/lib/api";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const authStore = (set) => ({
  user: null,

  actionLogin: async (form) => {
    const res = await api.post("/api/login", form);
    set({
      user: res.data.payload,
    });
    return res;
  },
  logout: async () => {
    try {
      await api.post("/api/logout");
    } catch {}
    set({ user: null });
  },
  clearAuth: () => {
    set({ user: null });
  },
});

const usePersist = {
  name: "auth-store",
  storage: createJSONStorage(() => localStorage),
};

const useAuthStore = create(persist(authStore, usePersist));

export default useAuthStore;
