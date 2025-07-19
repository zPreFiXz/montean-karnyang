import axios from "axios";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const authStore = (set) => ({
  user: null,
  token: null,
  actionLogin: async (form) => {
    const res = await axios.post(`${process.env.VITE_API_URL}/api/login`, form);
    set({
      user: res.data.payload,
      token: res.data.token,
    });
    return res;
  },
});

const usePersist = {
  name: "auth-storage",
  storage: createJSONStorage(() => localStorage),
};

const useAuthStore = create(persist(authStore, usePersist));

export default useAuthStore;
