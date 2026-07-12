import apiClient from "./apiClient";

export const listVehicles = async (search) => {
  return await apiClient.get("/vehicles", { params: { search } });
};

export const getVehicle = async (id) => {
  return await apiClient.get(`/vehicles/${id}`);
};
