import apiClient from "./apiClient";

export const listInventory = async (category, search, filterParams) => {
  return await apiClient.get("/inventory", {
    params: { category, search, ...(filterParams || {}) },
  });
};

export const getInventory = async (id, type) => {
  return await apiClient.get(`/inventory/${id}`, {
    params: type ? { type } : {},
  });
};

// บิลที่เคยใช้อะไหล่หรือบริการตัวนี้ (type = "part" | "service")
export const listInventoryRepairs = async (type, id) => {
  return await apiClient.get(`/inventory/${type}/${id}/repairs`);
};
