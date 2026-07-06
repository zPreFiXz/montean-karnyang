import axios from "axios";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const authStore = (set) => ({
  user: null,
  token: null,

  actionLogin: async (form) => {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/login`,
      form,
    );
    set({
      user: res.data.payload,
      token: res.data.token,
    });
    return res;
  },
  logout: async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/logout`);
    } catch (error) {
      console.log(error);
    }
    set({ user: null, token: null });
  },
});

const usePersist = {
  name: "auth-store",
  storage: createJSONStorage(() => localStorage),
};

const useAuthStore = create(persist(authStore, usePersist));

export default useAuthStore;
