import apiClient from "./apiClient";

export const listEmployees = async () => {
  return await apiClient.get("/employees");
};

export const createEmployee = async (data) => {
  return await apiClient.post("/employees", data);
};

export const updateEmployee = async (id, data) => {
  return await apiClient.put(`/employees/${id}`, data);
};

export const deleteEmployee = async (id) => {
  return await apiClient.delete(`/employees/${id}`);
};
