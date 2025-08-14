import api from "@/lib/api";

export const getRepairs = async () => {
  return await api.get("/api/repairs");
};
export const createRepair = async (data) => {
  return await api.post("/api/repair", data);
};
