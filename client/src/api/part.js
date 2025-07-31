import api from "@/lib/api";

export const createPart = async (data) => {
  return await api.post("/api/part", data);
};
