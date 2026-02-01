import api from "@/lib/api";

export const getVehicleBrandModels = async () => {
  return await api.get("/api/vehicles/brand-models");
};

export const createVehicleBrandModel = async (data) => {
  return await api.post("/api/vehicles/brand-models", data);
};

export const updateVehicleBrandModel = async (id, data) => {
  return await api.put(`/api/vehicles/brand-models/${id}`, data);
};

export const deleteVehicleBrandModel = async (id) => {
  return await api.delete(`/api/vehicles/brand-models/${id}`);
};
