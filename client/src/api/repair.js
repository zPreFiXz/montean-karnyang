import axios from "axios";

export const listRepairs = async (token) => {
  return await axios.get(`${import.meta.env.VITE_API_URL}/api/repairs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getRepair = async (token, id) => {
  return await axios.get(`${import.meta.env.VITE_API_URL}/api/repairs/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const createRepair = async (token, data) => {
  return await axios.post(`${import.meta.env.VITE_API_URL}/api/repairs`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateRepair = async (token, id, data) => {
  return await axios.put(`${import.meta.env.VITE_API_URL}/api/repairs/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateRepairStatus = async (token, id, data) => {
  return await axios.patch(`${import.meta.env.VITE_API_URL}/api/repairs/${id}/status`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
