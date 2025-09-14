import api from "@/lib/api";

export const getRepairs = async () => {
  return await api.get("/api/repairs");
};

export const getRepairById = async (id) => {
  return await api.get(`/api/repair/${id}`);
};

export const createRepair = async (data) => {
  return await api.post("/api/repair", data);
};

export const updateRepair = async (id, data) => {
  return await api.put(`/api/repair/${id}`, data);
};

export const updateRepairStatus = async (id, status, additionalData = {}) => {
  return await api.patch(`/api/repair/${id}/status`, {
    status,
    ...additionalData,
  });
};
