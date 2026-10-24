import apiClient from "@/api/apiClient";

export const listCategories = async () => {
  return await apiClient.get("/categories");
};
