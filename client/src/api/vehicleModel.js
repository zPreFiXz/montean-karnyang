import apiClient from "./apiClient";

export const listVehicleModels = async () => {
  return await apiClient.get("/vehicles/models");
};

export const createVehicleModel = async (data) => {
  return await apiClient.post("/vehicles/models", data);
};

export const updateVehicleModel = async (id, data) => {
  return await apiClient.put(`/vehicles/models/${id}`, data);
};

export const deleteVehicleModel = async (id) => {
  return await apiClient.delete(`/vehicles/models/${id}`);
};
