import apiClient from "./apiClient";

// สินค้าขายดีของช่วงเวลาที่เลือก ขอบเขตวันคิดจากเวลาเครื่องของคนดู ให้ตรงกับรายงานยอดขาย
export const listTopItems = async (startDate, endDate) => {
  return await apiClient.get("/reports/top-items", {
    params: { from: startDate.toISOString(), to: endDate.toISOString() },
  });
};
