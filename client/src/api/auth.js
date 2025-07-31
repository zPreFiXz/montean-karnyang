import api from "@/lib/api";

export const currentUser = async () => {
  return await api.post("/api/current-user");
};

export const currentAdmin = async () => {
  return await api.post("/api/current-admin");
};
