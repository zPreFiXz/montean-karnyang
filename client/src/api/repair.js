import api from "@/lib/api";

export const createRepair = async (data) => {
  return await api.post("/api/repair", data);
};
