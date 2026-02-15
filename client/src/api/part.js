import api from "@/lib/api";

export const getParts = async () => {
  return await api.get("/api/parts");
};

export const createPart = async (data) => {
  return await api.post("/api/parts", data);
};

export const updatePart = async (id, data) => {
  return await api.put(`/api/parts/${id}`, data);
};

export const updatePartStock = async (id, data) => {
  return await api.patch(`/api/parts/${id}/stock`, data);
};

export const deletePart = async (id) => {
  return await api.delete(`/api/parts/${id}`);
};
