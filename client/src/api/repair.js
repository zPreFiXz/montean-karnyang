import apiClient from "./apiClient";

export const listRepairs = async () => {
  return await apiClient.get("/repairs");
};

export const getRepair = async (id) => {
  return await apiClient.get(`/repairs/${id}`);
};

export const createRepair = async (data) => {
  return await apiClient.post("/repairs", data);
};

export const updateRepair = async (id, data) => {
  return await apiClient.put(`/repairs/${id}`, data);
};

export const updateRepairStatus = async (id, data) => {
  return await apiClient.patch(`/repairs/${id}/status`, data);
};
