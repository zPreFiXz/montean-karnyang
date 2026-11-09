import apiClient from "@/api/apiClient";

export const listInventory = async (category, search, filterParams) => {
  return await apiClient.get("/inventory", {
    params: { category, search, ...(filterParams || {}) },
  });
};

export const getInventory = async (id, type) => {
  return await apiClient.get(`/inventory/${id}`, {
    params: type ? { type } : {},
  });
};

// บิลที่เคยใช้อะไหล่หรือบริการตัวนี้ (type = "part" | "service")
export const listInventoryRepairs = async (type, id) => {
  return await apiClient.get(`/inventory/${type}/${id}/repairs`);
};

// บรรทัดอะไหล่อื่นๆ ที่ยังไม่มีหน่วย
export const listMissingUnitItems = async () => {
  return await apiClient.get("/inventory/missing-units");
};

export const countMissingUnitItems = async () => {
  return await apiClient.get("/inventory/missing-units/count");
};

// หน่วยที่เคยใช้แล้ว { partUnits, serviceUnits } ใช้เติมรายการในช่องเลือกหน่วย
export const listUnits = async () => {
  return await apiClient.get("/inventory/units");
};
