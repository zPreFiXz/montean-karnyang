import api from "@/lib/api";

export const getDailyAttendanceSummary = async (date) => {
  return await api.get("/api/attendance/daily-summary", {
    params: { date },
  });
};
