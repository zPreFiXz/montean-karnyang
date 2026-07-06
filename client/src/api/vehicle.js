import axios from "axios";

export const listVehicles = async (token, search) => {
  return await axios.get(`${import.meta.env.VITE_API_URL}/api/vehicles`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: { search },
  });
};

export const getVehicle = async (token, id) => {
  return await axios.get(`${import.meta.env.VITE_API_URL}/api/vehicles/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
