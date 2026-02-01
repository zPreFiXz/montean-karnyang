import api from "@/lib/api";

export const getEmployees = async () => {
  return await api.get("/api/employees");
};

export const createEmployee = async (data) => {
  return await api.post("/api/employees", data);
};

export const updateEmployee = async (id, data) => {
  return await api.put(`/api/employees/${id}`, data);
};

export const deleteEmployee = async (id) => {
  return await api.delete(`/api/employees/${id}`);
};
