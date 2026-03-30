import api from "@/lib/api";

export const getUsers = async () => {
  return await api.get("/api/users");
};

export const createUser = async (data) => {
  return await api.post("/api/users", data);
};

export const updateUser = async (id, data) => {
  return await api.put(`/api/users/${id}`, data);
};

export const deleteUser = async (id) => {
  return await api.delete(`/api/users/${id}`);
};
