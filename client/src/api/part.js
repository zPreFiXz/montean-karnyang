import axios from "axios";

export const listParts = async (token) => {
  return await axios.get(`${import.meta.env.VITE_API_URL}/api/parts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const createPart = async (token, data) => {
  return await axios.post(`${import.meta.env.VITE_API_URL}/api/parts`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updatePart = async (token, id, data) => {
  return await axios.put(`${import.meta.env.VITE_API_URL}/api/parts/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updatePartStock = async (token, id, data) => {
  return await axios.patch(`${import.meta.env.VITE_API_URL}/api/parts/${id}/stock`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const deletePart = async (token, id) => {
  return await axios.delete(`${import.meta.env.VITE_API_URL}/api/parts/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
