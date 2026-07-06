import axios from "axios";

export const listUsers = async (token) => {
  return await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const createUser = async (token, data) => {
  return await axios.post(`${import.meta.env.VITE_API_URL}/api/users`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateUser = async (token, id, data) => {
  return await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const deleteUser = async (token, id) => {
  return await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
