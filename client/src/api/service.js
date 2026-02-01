import api from "@/lib/api";

export const createService = async (data) => {
  return await api.post("/api/services", data);
};

export const updateService = async (id, data) => {
  return await api.put(`/api/services/${id}`, data);
};

export const deleteService = async (id) => {
  return await api.delete(`/api/services/${id}`);
};
