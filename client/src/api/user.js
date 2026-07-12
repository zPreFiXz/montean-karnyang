import apiClient from "./apiClient";

export const listUsers = async () => {
  return await apiClient.get("/users");
};

export const createUser = async (data) => {
  return await apiClient.post("/users", data);
};

export const updateUser = async (id, data) => {
  return await apiClient.put(`/users/${id}`, data);
};

export const deleteUser = async (id) => {
  return await apiClient.delete(`/users/${id}`);
};
