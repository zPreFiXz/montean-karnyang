import apiClient from "./apiClient";

export const listCategories = async () => {
  return await apiClient.get("/categories");
};
