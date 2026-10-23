import apiClient from "./apiClient";

export const createService = async (data) => {
  return await apiClient.post("/services", data);
};

export const updateService = async (id, data) => {
  return await apiClient.put(`/services/${id}`, data);
};

export const deleteService = async (id) => {
  return await apiClient.delete(`/services/${id}`);
};
