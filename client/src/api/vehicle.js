import apiClient from "./apiClient";

export const listVehicles = async (search) => {
  return await apiClient.get("/vehicles", { params: { search } });
};

// ค้นรถจากทะเบียนตอนกรอกบิล คืน null ถ้าไม่เคยมี
// excludeRepairId = บิลที่กำลังแก้อยู่ ไม่นับเป็นครั้งที่เคยมา
export const lookupVehicleByPlate = async (
  plate,
  province,
  excludeRepairId,
) => {
  return await apiClient.get("/vehicles/lookup", {
    params: { plate, province, excludeRepairId },
  });
};

export const getVehicle = async (id) => {
  return await apiClient.get(`/vehicles/${id}`);
};

export const deleteVehicle = async (id) => {
  return await apiClient.delete(`/vehicles/${id}`);
};
