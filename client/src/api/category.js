import api from "@/lib/api";

export const getCategories = async () => {
  return await api.get("/api/categories");
};
