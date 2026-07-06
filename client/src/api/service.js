import axios from "axios";

export const createService = async (token, data) => {
  return await axios.post(`${import.meta.env.VITE_API_URL}/api/services`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateService = async (token, id, data) => {
  return await axios.put(`${import.meta.env.VITE_API_URL}/api/services/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const deleteService = async (token, id) => {
  return await axios.delete(`${import.meta.env.VITE_API_URL}/api/services/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
