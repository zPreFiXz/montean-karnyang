import api from "@/lib/api";

export const createPart = async (data) => {
  return await api.post("/api/part", data);
};

export const updatePart = async (id, data) => {
  return await api.put(`/api/part/${id}`, data);
};
