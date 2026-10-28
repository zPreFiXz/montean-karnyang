import apiClient from "@/api/apiClient";

// อะไหล่ขายดีของช่วงเวลาที่เลือก ขอบเขตวันคิดจากเวลาเครื่องของคนดู ให้ตรงกับรายงานยอดขาย
export const listTopItems = async (startDate, endDate) => {
  return await apiClient.get("/reports/top-items", {
    params: { from: startDate.toISOString(), to: endDate.toISOString() },
  });
};

export const listTopVehicleModels = async (startDate, endDate) => {
  return await apiClient.get("/reports/top-vehicle-models", {
    params: { from: startDate.toISOString(), to: endDate.toISOString() },
  });
};

export const getVehicleModelReport = async (id, startDate, endDate) => {
  return await apiClient.get(`/reports/top-vehicle-models/${id}`, {
    params: { from: startDate.toISOString(), to: endDate.toISOString() },
  });
};
