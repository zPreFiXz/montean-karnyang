import axios from "axios";

export const createVehicle = async (token, data) => {
  return await axios.post("http://localhost:3000/api/vehicle", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
