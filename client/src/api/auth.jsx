import api from "@/lib/api";

export const currentUser = async () => {
  await api.post("/api/current-user");
};

export const currentAdmin = async () => {
  await api.post("/api/current-admin");
};
