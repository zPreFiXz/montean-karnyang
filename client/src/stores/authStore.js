import api from "@/lib/api";
import { toast } from "sonner";
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
  logout: () => {
    set({ user: null });
  },
});

const usePersist = {
  name: "auth-storage",
  storage: createJSONStorage(() => localStorage),
};

const useAuthStore = create(persist(authStore, usePersist));

export default useAuthStore;
