import apiClient from "./apiClient";

export const listCustomers = async (search) => {
  return await apiClient.get("/customers", { params: { search } });
};
