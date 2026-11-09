import apiClient from "@/api/apiClient";

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

export const listChequeBanks = async () => {
  return await apiClient.get("/repairs/cheque-banks");
};

export const listDocumentNumbers = async (prefix, period) => {
  return await apiClient.get("/repairs/document-numbers", {
    params: { prefix, period },
  });
};

// รถที่เปลี่ยนยางสี่เส้นแล้วมาตั้งศูนย์ในบิลถัดไป
export const listLateAlignments = async () => {
  return await apiClient.get("/repairs/late-alignments");
};

export const updateRepairStatus = async (id, data) => {
  return await apiClient.patch(`/repairs/${id}/status`, data);
};

export const cancelRepair = async (id, data = {}) => {
  return await apiClient.patch(`/repairs/${id}/cancel`, data);
};

export const deleteRepair = async (id) => {
  return await apiClient.delete(`/repairs/${id}`);
};

// สั่งพิมพ์ใบเสร็จออกเครื่องพิมพ์ที่ต่อกับคอมที่รันเซิร์ฟเวอร์ (กดจากมือถือได้)
export const printRepairReceipt = async (id, options = {}) => {
  // ค่าเริ่มต้นต้องตรงกับหน้าตัวอย่าง ใบที่พิมพ์ออกมาจะได้เหมือนที่เห็นทุกครั้ง
  const {
    showCustomer = false,
    showBrand = false,
    docType = "receipt",
    copyChoice = "both",
  } = options;
  return await apiClient.post(`/repairs/${id}/print`, {
    showCustomer,
    showBrand,
    docType,
    copyChoice,
  });
};

// ใบเดียวกับที่พิมพ์ แต่ได้เป็นรูป (ข้อความ base64 แผ่นละรูป) ไว้ส่งให้ลูกค้าทางแชท
export const renderRepairImages = async (id, options = {}) => {
  const {
    showCustomer = false,
    showBrand = false,
    docType = "receipt",
    copyChoice = "original",
  } = options;
  return await apiClient.post(`/repairs/${id}/image`, {
    showCustomer,
    showBrand,
    docType,
    copyChoice,
  });
};
