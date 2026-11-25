import apiClient from "@/api/apiClient";

// params = { from, to, open } (ISO) บิลที่ยังไม่ปิดกับบิลที่มีเงินเข้าออกในช่วงนั้น ไม่ส่ง = ทุกบิล
// open: "0" = ไม่เอาบิลที่ยังไม่ปิด (รายงานยอดขายใช้แค่เงินในช่วง)
export const listRepairs = async (params) => {
  return await apiClient.get("/repairs", { params });
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
    depositNote,
  } = options;
  return await apiClient.post(`/repairs/${id}/print`, {
    showCustomer,
    showBrand,
    docType,
    copyChoice,
    // ไม่ส่งมา = ไม่ได้อยู่ที่ใบรับเงินมัดจำ ข้อความที่บันทึกไว้ไม่เปลี่ยน
    depositNote,
  });
};

// ใบเดียวกับที่พิมพ์ แต่ได้เป็นรูป (ข้อความ base64 แผ่นละรูป) ไว้ส่งให้ลูกค้าทางแชท
export const renderRepairImages = async (id, options = {}) => {
  const {
    showCustomer = false,
    showBrand = false,
    docType = "receipt",
    copyChoice = "original",
    depositNote,
  } = options;
  return await apiClient.post(`/repairs/${id}/image`, {
    showCustomer,
    showBrand,
    docType,
    copyChoice,
    // ไม่ส่งมา = ไม่ได้อยู่ที่ใบรับเงินมัดจำ ข้อความที่บันทึกไว้ไม่เปลี่ยน
    depositNote,
  });
};

// amount = 0 คือลบมัดจำที่บันทึกผิด
export const setRepairDeposit = async (id, data) => {
  return await apiClient.patch(`/repairs/${id}/deposit`, data);
};

// dueDate = "ปปปป-ดด-วว" หรือ null เพื่อล้าง
export const setRepairDueDate = async (id, dueDate) => {
  return await apiClient.patch(`/repairs/${id}/due-date`, { dueDate });
};
