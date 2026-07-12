import apiClient from "./apiClient";

export const getAttendanceSummary = async (date) => {
  return await apiClient.get("/attendances/summary", { params: { date } });
};
