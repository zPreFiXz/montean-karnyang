import axios from "axios";

export const currentUser = async (token) => {
  return await axios.get(`${import.meta.env.VITE_API_URL}/api/current-user`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const currentAdmin = async (token) => {
  return await axios.get(`${import.meta.env.VITE_API_URL}/api/current-admin`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
