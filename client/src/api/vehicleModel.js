import apiClient from "./apiClient";

export const listVehicleModels = async () => {
  return await apiClient.get("/vehicles/models");
};

export const createVehicleModel = async (data) => {
  return await apiClient.post("/vehicles/models", data);
};

export const updateVehicleModel = async (id, data) => {
  return await apiClient.put(`/vehicles/models/${id}`, data);
};

// ส่งลำดับใหม่ทั้งชุด (อาเรย์ของ id) ให้เซิร์ฟเวอร์เขียนทับ
export const reorderVehicleModels = async (ids) => {
  return await apiClient.patch("/vehicles/models/reorder", { ids });
};

export const deleteVehicleModel = async (id) => {
  return await apiClient.delete(`/vehicles/models/${id}`);
};
