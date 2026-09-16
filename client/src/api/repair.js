import apiClient from "./apiClient";

export const listRepairs = async () => {
  return await apiClient.get("/repairs");
};

export const getRepair = async (id) => {
  return await apiClient.get(`/repairs/${id}`);
};

export const createRepair = async (data) => {
  return await apiClient.post("/repairs", data);
};

export const updateRepair = async (id, data) => {
  return await apiClient.put(`/repairs/${id}`, data);
};

export const updateRepairStatus = async (id, data) => {
  return await apiClient.patch(`/repairs/${id}/status`, data);
};

export const deleteRepair = async (id) => {
  return await apiClient.delete(`/repairs/${id}`);
};

// สั่งพิมพ์ใบเสร็จออกเครื่องพิมพ์ที่ต่อกับคอมที่รันเซิร์ฟเวอร์ (กดจากมือถือได้)
export const printRepairReceipt = async (id, options = {}) => {
  // ค่าเริ่มต้นต้องตรงกับหน้าตัวอย่าง ใบที่พิมพ์ออกมาจะได้เหมือนที่เห็นทุกครั้ง
  const {
    showCustomer = true,
    showBrand = false,
    docType = "receipt",
  } = options;
  return await apiClient.post(`/repairs/${id}/print`, {
    showCustomer,
    showBrand,
    docType,
  });
};
