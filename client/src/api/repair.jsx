import api from "@/lib/api";

export const createRepair = async (data) => {
  await api.post("/api/repair", data);
};
