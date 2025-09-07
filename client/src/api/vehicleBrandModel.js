import api from "@/lib/api";

export const getVehicleBrandModels = async () => {
  return await api.get("/api/vehicle-brand-models");
};

export const createVehicleBrandModel = async (data) => {
  return await api.post("/api/vehicle-brand-model", data);
};

export const updateVehicleBrandModel = async (id, data) => {
  return await api.put(`/api/vehicle-brand-model/${id}`, data);
};

export const deleteVehicleBrandModel = async (id) => {
  return await api.delete(`/api/vehicle-brand-model/${id}`);
};
