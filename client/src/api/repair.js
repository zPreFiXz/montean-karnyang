import api from "@/lib/api";

export const getRepairs = async () => {
  return await api.get("/api/repairs");
};

export const getRepairById = async (id) => {
  return await api.get(`/api/repairs/${id}`);
};

export const createRepair = async (data) => {
  return await api.post("/api/repairs", data);
};

export const updateRepair = async (id, data) => {
  return await api.put(`/api/repairs/${id}`, data);
};

export const updateRepairStatus = async (id, data) => {
  return await api.patch(`/api/repairs/${id}/status`, data);
};
