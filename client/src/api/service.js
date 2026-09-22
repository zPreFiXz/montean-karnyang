import apiClient from "./apiClient";

export const createService = async (data) => {
  return await apiClient.post("/services", data);
};

export const updateService = async (id, data) => {
  return await apiClient.put(`/services/${id}`, data);
};

export const deleteService = async (id) => {
  return await apiClient.delete(`/services/${id}`);
};

// ชื่อที่เคยพิมพ์ทับไว้ในบิลของบริการตัวนี้ ไว้ให้เลือกซ้ำตอนเปิดบิลใหม่
export const listServiceItemNames = async (id, search) => {
  return await apiClient.get(`/services/${id}/item-names`, {
    params: { search },
  });
};
