import axios from "axios";

export const listEmployees = async (token) => {
  return await axios.get(`${import.meta.env.VITE_API_URL}/api/employees`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const createEmployee = async (token, data) => {
  return await axios.post(`${import.meta.env.VITE_API_URL}/api/employees`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateEmployee = async (token, id, data) => {
  return await axios.put(`${import.meta.env.VITE_API_URL}/api/employees/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const deleteEmployee = async (token, id) => {
  return await axios.delete(`${import.meta.env.VITE_API_URL}/api/employees/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
