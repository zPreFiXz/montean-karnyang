import apiClient from "@/api/apiClient";

export const listVehicles = async (search) => {
  return await apiClient.get("/vehicles", { params: { search } });
};

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
