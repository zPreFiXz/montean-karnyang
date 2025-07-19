import axios from "axios";

export const createRepair = async (token, data) => {
  return await axios.post(`${import.meta.env.VITE_API_URL}/api/repair`, data, {
    withCredentials: true,
  });
};
