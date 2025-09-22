import api from "@/lib/api";

export const getEmployees = async () => {
  return await api.get("/api/employees");
};

export const createEmployee = async (data) => {
  return await api.post("/api/employee", data);
};

export const updateEmployee = async (id, data) => {
  return await api.put(`/api/employee/${id}`, data);
};

export const deleteEmployee = async (id) => {
  return await api.delete(`/api/employee/${id}`);
};
