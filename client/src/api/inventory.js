import api from "@/lib/api";

export const getInventory = async (category, search) => {
  const params = {};

  if (category) params.category = category;
  if (search) params.search = search;

  return await api.get("/api/inventory", { params });
};
