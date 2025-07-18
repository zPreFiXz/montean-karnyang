import axios from "axios";

export const createRepair = async (token, data) => {
  return await axios.post("http://localhost:3000/api/repair", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
