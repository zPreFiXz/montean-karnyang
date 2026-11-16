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

// ยี่ห้อเดียวกันที่สะกดตัวพิมพ์เล็กใหญ่ต่างกัน
export const listBrandVariants = async () => {
  return await apiClient.get("/parts/brand-variants");
};

export const mergeBrandVariants = async (key, brand) => {
  return await apiClient.post("/parts/brand-variants/merge", { key, brand });
};
