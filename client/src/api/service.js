import api from "@/lib/api";

export const createService = async (data) => {
  return await api.post("/api/service", data);
};
