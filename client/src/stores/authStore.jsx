import axios from "axios";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const authStore = (set) => ({
  user: null,
  actionLogin: async (form) => {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/login`,
      form,
      {
        withCredentials: true,
      }
    );
    set({
      user: res.data.payload,
    });
    return res;
  },
  logout: () => {
    set({
      user: null,
    });
  },
});

const usePersist = {
  name: "auth-storage",
  storage: createJSONStorage(() => localStorage),
};

const useAuthStore = create(persist(authStore, usePersist));

export default useAuthStore;
