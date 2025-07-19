import axios from "axios";

export const currentUser = async () => {
  return await axios.post(`${import.meta.env.VITE_API_URL}/api/current-user`, {
    withCredentials: true,
  });
};

export const currentAdmin = async () => {
  return await axios.post(`${import.meta.env.VITE_API_URL}/api/current-admin`, {
    withCredentials: true,
  });
};
