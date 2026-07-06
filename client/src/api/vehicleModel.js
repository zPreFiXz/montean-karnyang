import api from "@/lib/api";

export const getVehicleBrands = async () => {
  return await api.get("/api/vehicles/brands");
};

export const createVehicleBrand = async (data) => {
  return await api.post("/api/vehicles/brands", data);
};

export const updateVehicleBrand = async (id, data) => {
  return await api.put(`/api/vehicles/brands/${id}`, data);
};

export const deleteVehicleBrand = async (id) => {
  return await api.delete(`/api/vehicles/brands/${id}`);
};
