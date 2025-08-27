import api from "@/lib/api";

export const getInventory = async (category, search) => {
  return await api.get("/api/inventory", {
    params: { category, search },
  });
};
