import api from "@/lib/api";

export const getInventory = async (category, search) => {
  return await api.get("/api/inventory", {
    params: { category, search },
  });
};

export const getInventoryById = async (id, type) => {
  return await api.get(`/api/inventory/${id}`, {
    params: type ? { type } : {},
  });
};
