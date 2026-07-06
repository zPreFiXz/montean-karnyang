import axios from "axios";

export const listVehicleModels = async (token) => {
  return await axios.get(`${import.meta.env.VITE_API_URL}/api/vehicles/models`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const createVehicleModel = async (token, data) => {
  return await axios.post(`${import.meta.env.VITE_API_URL}/api/vehicles/models`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateVehicleModel = async (token, id, data) => {
  return await axios.put(`${import.meta.env.VITE_API_URL}/api/vehicles/models/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const deleteVehicleModel = async (token, id) => {
  return await axios.delete(`${import.meta.env.VITE_API_URL}/api/vehicles/models/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
