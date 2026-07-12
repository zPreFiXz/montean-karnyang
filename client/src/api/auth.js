import apiClient from "./apiClient";

export const currentUser = async () => {
  return await apiClient.get("/current-user");
};

export const currentAdmin = async () => {
  return await apiClient.get("/current-admin");
};
