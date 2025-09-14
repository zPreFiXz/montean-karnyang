import api from "@/lib/api";

export const getParts = async () => {
  return await api.get("/api/parts");
};

export const createPart = async (data) => {
  return await api.post("/api/part", data);
};

export const updatePart = async (id, data) => {
  return await api.put(`/api/part/${id}`, data);
};

export const addStock = async (id, quantity) => {
  return await api.patch(`/api/part/${id}/add-stock`, { quantity });
};
