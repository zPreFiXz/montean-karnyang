import apiClient from "./apiClient";

export const listParts = async () => {
  return await apiClient.get("/parts");
};

export const createPart = async (data) => {
  return await apiClient.post("/parts", data);
};

export const updatePart = async (id, data) => {
  return await apiClient.put(`/parts/${id}`, data);
};

export const updatePartStock = async (id, data) => {
  return await apiClient.patch(`/parts/${id}/stock`, data);
};

export const deletePart = async (id) => {
  return await apiClient.delete(`/parts/${id}`);
};
