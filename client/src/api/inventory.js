import axios from "axios";

export const listInventory = async (token, category, search, filterParams) => {
  return await axios.get(`${import.meta.env.VITE_API_URL}/api/inventory`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: { category, search, ...(filterParams || {}) },
  });
};

export const getInventory = async (token, id, type) => {
  return await axios.get(`${import.meta.env.VITE_API_URL}/api/inventory/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: type ? { type } : {},
  });
};
