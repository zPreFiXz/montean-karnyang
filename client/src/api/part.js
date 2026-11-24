import apiClient from "@/api/apiClient";

export const listParts = async () => {
  return await apiClient.get("/parts");
};

export const createPart = async (data) => {
  return await apiClient.post("/parts", data);
};

export const updatePart = async (id, data) => {
  return await apiClient.put(`/parts/${id}`, data);
};

export const updatePartStock = async (id, data) => {
  return await apiClient.patch(`/parts/${id}/stock`, data);
};

export const deletePart = async (id) => {
  return await apiClient.delete(`/parts/${id}`);
};

// ยี่ห้อกับชื่อของอะไหล่ในหมวดนี้ ไว้แนะนำตอนกรอกฟอร์ม
export const listPartHints = async (categoryId) => {
  return await apiClient.get("/parts/hints", { params: { categoryId } });
};

// ฉลากสติกเกอร์ติดอะไหล่ (เครื่องพิมพ์ความร้อนในร้าน) รูปตัวอย่างวาดจากข้อมูลเดียวกับที่พิมพ์
export const previewPartLabel = async (id, options) => {
  return await apiClient.post(`/parts/${id}/label/preview`, options);
};

export const printPartLabel = async (id, options) => {
  return await apiClient.post(`/parts/${id}/label/print`, options);
};
