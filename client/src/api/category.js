import axios from "axios";

export const listCategories = async (token) => {
  return await axios.get(`${import.meta.env.VITE_API_URL}/api/categories`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
