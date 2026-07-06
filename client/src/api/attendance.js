import axios from "axios";

export const getAttendanceSummary = async (token, date) => {
  return await axios.get(`${import.meta.env.VITE_API_URL}/api/attendances/summary`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: { date },
  });
};
