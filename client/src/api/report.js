import apiClient from "./apiClient";

// สินค้าขายดีของช่วงเวลาที่เลือก ขอบเขตวันคิดจากเวลาเครื่องของคนดู ให้ตรงกับรายงานยอดขาย
export const listTopItems = async (startDate, endDate) => {
  return await apiClient.get("/reports/top-items", {
    params: { from: startDate.toISOString(), to: endDate.toISOString() },
  });
};

// รุ่นรถที่มาบ่อยในช่วงเวลาเดียวกับสินค้าขายดี
export const listTopVehicleModels = async (startDate, endDate) => {
  return await apiClient.get("/reports/top-vehicle-models", {
    params: { from: startDate.toISOString(), to: endDate.toISOString() },
  });
};
