import api from "@/lib/api";

export const createService = async (data) => {
  return await api.post("/api/service", data);
};

export const updateService = async (id, data) => {
  return await api.put(`/api/service/${id}`, data);
};
